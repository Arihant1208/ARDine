
import { Type } from "@google/genai";
import { getAIClient } from "./aiClient";
import { Dish, UserId } from "../types";
import { validateMenuImage } from "./validators";
import { MenuRepository } from "../database/repositories";
import { db } from "../database/dbClient";

export const processMenuUpload = async (userId: UserId, base64Image: string): Promise<Dish> => {
  if (!validateMenuImage(base64Image)) {
    throw new Error("Invalid image format");
  }

  const ai = getAIClient();
  const imageData = base64Image.split(',')[1];

  // Pass 1: Semantic Analysis and 3D Modeling Prompt
  // This extracts the specific geometric instructions needed for a custom 3D pipeline
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
  
  const initialDish: Dish = {
    id: `dish_${Date.now()}`,
    userId,
    ...aiResult,
    images: [base64Image],
    isARReady: false,
    modelGenerationStatus: 'generating',
    generationProgress: 10,
    arModelUrl: undefined
  };

  const savedDish = await MenuRepository.save(initialDish);

  // Background 3D Generation Simulation (Custom Pipeline)
  // In production, this would dispatch the 'geometricPrompt' to a worker or cloud service like Sketchfab's conversion API
  simulateThreeDPipeline(userId, savedDish.id);

  return savedDish;
};

const simulateThreeDPipeline = async (userId: UserId, dishId: string) => {
  const steps = [
    { progress: 20, status: 'generating' as const },
    { progress: 45, status: 'generating' as const },
    { progress: 75, status: 'generating' as const },
    { progress: 90, status: 'generating' as const },
    { progress: 100, status: 'ready' as const }
  ];

  for (const step of steps) {
    // Artificial delay to simulate heavy 3D processing (Photogrammetry, Mesh optimization, GLB packing)
    await new Promise(resolve => setTimeout(resolve, 4000 + Math.random() * 2000));
    
    const updates: Partial<Dish> = {
      generationProgress: step.progress,
      modelGenerationStatus: step.status
    };

    if (step.status === 'ready') {
      updates.isARReady = true;
      // High-quality GLB file link - In a real app, this would be the actual generated asset URL
      updates.arModelUrl = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
    }

    await db.updateDishStatus(userId, dishId, updates);
  }
};

export const fetchMenu = async (userId: UserId): Promise<Dish[]> => {
  return await MenuRepository.getAll(userId);
};
