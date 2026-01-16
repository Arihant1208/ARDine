
import { GoogleGenAI } from "@google/genai";

/**
 * Initializes and returns a new instance of the Google GenAI client.
 * Using a factory pattern ensures we always have the latest API key from the environment.
 */
export const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not defined");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};
