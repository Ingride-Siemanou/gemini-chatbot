import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODELES = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest"];

async function demander(prompt) {
  for (const model of MODELES) {
    for (let essai = 1; essai <= 3; essai++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        console.log(`(modèle utilisé : ${model})`);
        return response.text;
      } catch (err) {
        const surcharge = err.status === 503 || err.status === 429;
        console.log(`❌ ${model}, essai ${essai} : erreur ${err.status}`);
        if (!surcharge) break; // autre erreur : on passe au modèle suivant
        await new Promise((r) => setTimeout(r, 2000 * essai)); // attend 2 s, 4 s, 6 s
      }
    }
  }
  throw new Error("Aucun modèle n'a répondu pour le moment.");
}

console.log(await demander("Réponds uniquement par : Connexion Gemini réussie"));