
import { Type } from "@google/genai";
import { getAIClient } from "./aiClient";
import { Dish, UserId } from "../src/shared/types";
import { validateMenuImage } from "./validators";
import { MenuRepository } from "../database/repositories";
import { uploadFile, BUCKET_IMAGES, deleteFile, BUCKET_MODELS } from "./storageClient";
import { scanBuffer } from "./scannerClient";
import { enqueueModelGeneration } from "./queue";

export const processMenuUpload = async (userId: UserId, base64Image: string): Promise<Dish> => {
  if (!validateMenuImage(base64Image)) {
    throw new Error("Invalid image format");
  }

  // Step 1: Decode and scan the image with ClamAV
  const imageData = base64Image.split(',')[1];
  const imageBuffer = Buffer.from(imageData, 'base64');

  try {
    const scanResult = await scanBuffer(imageBuffer);
    if (!scanResult.clean) {
      throw new Error(`Image failed security scan: ${scanResult.detail}`);
    }
  } catch (err) {
    // If ClamAV is unavailable, log warning but don't block in development
    const isCritical = process.env.CLAMAV_REQUIRED === 'true';
    if (isCritical) throw err;
    console.warn(`[Menu] ClamAV unavailable, skipping scan: ${(err as Error).message}`);
  }

  // Step 2: Upload image to S3-compatible blob storage (MinIO locally)
  const imageId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const mimeMatch = base64Image.match(/^data:image\/(png|jpeg|jpg|webp);base64,/);
  const ext = mimeMatch?.[1] === 'jpeg' ? 'jpg' : (mimeMatch?.[1] ?? 'jpg');
  const objectKey = `${userId}/${imageId}.${ext}`;
  const contentType = `image/${mimeMatch?.[1] ?? 'jpeg'}`;

  const imageUrl = await uploadFile(BUCKET_IMAGES, objectKey, imageBuffer, contentType);

  // Step 3: AI analysis — pass raw base64 to Gemini (not the stored URL)
  const ai = getAIClient();

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: imageData, mimeType: 'image/jpeg' } },
        { text: "Analyze this dish photo for high-fidelity 3D reconstruction. Return JSON with name, description, price (number), category, portionSize, and a 'geometricPrompt' that describes the precise 3D geometry, material properties (glossiness, translucency), and scale for a photogrammetry engine." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          portionSize: { type: Type.STRING },
          price: { type: Type.NUMBER },
          category: { type: Type.STRING },
          geometricPrompt: { type: Type.STRING }
        },
        required: ["name", "description", "portionSize", "price", "category", "geometricPrompt"]
      }
    }
  });

  const aiResult = JSON.parse(response.text || "{}");

  // Step 4: Save dish with blob storage URL (not base64)
  const initialDish: Dish = {
    id: `dish_${Date.now()}`,
    userId,
    ...aiResult,
    images: [imageUrl], // URL to MinIO/S3, not base64
    isARReady: false,
    modelGenerationStatus: 'generating',
    generationProgress: 10,
    arModelUrl: undefined
  };

  const savedDish = await MenuRepository.save(initialDish);

  // Step 5: Enqueue 3D model generation job via BullMQ (instead of in-process setTimeout)
  await enqueueModelGeneration({
    dishId: savedDish.id,
    userId,
    geometricPrompt: aiResult.geometricPrompt,
    imageUrl,
  });

  return savedDish;
};


export const fetchMenu = async (userId: UserId): Promise<Dish[]> => {
  return await MenuRepository.getAll(userId);
};

/** Delete a dish and its associated files from storage. */
export const deleteDish = async (userId: UserId, dishId: string): Promise<void> => {
  const { images, arModelUrl } = await MenuRepository.delete(userId, dishId);

  // Best-effort cleanup of blob storage files
  for (const imageUrl of images) {
    try {
      // Extract object key from the URL: e.g., ".../dish-images/userId/file.jpg" → "userId/file.jpg"
      const key = imageUrl.split(`/${BUCKET_IMAGES}/`)[1];
      if (key) await deleteFile(BUCKET_IMAGES, key);
    } catch {
      // Non-critical: log but don't fail
      console.warn(`[Menu] Failed to delete image blob: ${imageUrl}`);
    }
  }

  if (arModelUrl) {
    try {
      const key = arModelUrl.split(`/${BUCKET_MODELS}/`)[1];
      if (key) await deleteFile(BUCKET_MODELS, key);
    } catch {
      console.warn(`[Menu] Failed to delete model blob: ${arModelUrl}`);
    }
  }
};
