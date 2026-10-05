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

// Route permettant de vérifier que le serveur fonctionne.
app.get("/", (req, res) => {
  res.send("Serveur Gemini Chatbot opérationnel !");
});

// Route utilisée pour envoyer un message à Gemini.
app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({
        error: "Le message est obligatoire.",
      });
    }

    console.log("Message reçu :", message);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
    });

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