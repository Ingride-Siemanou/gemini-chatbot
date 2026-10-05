import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const response = await ai.models.generateContent({
  model: "gemini-3.8-flash",
  contents: "Réponds uniquement par : Connexion Gemini réussie",
});

console.log(response.text);