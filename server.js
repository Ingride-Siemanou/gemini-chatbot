import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Création du client Gemini.
// La clé reste dans le fichier .env et n'est jamais envoyée au navigateur.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Permet à Express de comprendre le JSON reçu.
app.use(express.json());

// Permet à Express de servir les fichiers du dossier public.
// Quand on visite http://localhost:3000,
// Express affiche automatiquement public/index.html.
app.use(express.static("public"));

// Route utilisée pour envoyer un message à Gemini.
app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message;

    // Vérifie qu'un message a bien été envoyé.
    if (!message) {
      return res.status(400).json({
        error: "Le message est obligatoire.",
      });
    }

    console.log("Message reçu :", message);

    // Envoi du message à Gemini.
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
    });

    // Renvoie la réponse de Gemini au navigateur.
    res.json({
      reply: response.text,
    });
  } catch (error) {
    console.error("Erreur Gemini :", error.message || error);

    res.status(500).json({
      error: "Impossible d'obtenir une réponse de Gemini.",
    });
  }
});

// Démarrage du serveur.
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});