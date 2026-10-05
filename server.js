import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(express.json());
app.use(express.static("public"));

// Petite pause utilisée entre deux tentatives.
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Appelle Gemini et réessaie automatiquement en cas de 503.
async function generateWithRetry(contents, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          maxOutputTokens: 300,
        },
      });
    } catch (error) {
      const status = error.status;

      console.error(
        `Tentative Gemini ${attempt}/${maxAttempts} :`,
        status || error.message
      );

      // On ne réessaie que pour une surcharge temporaire.
      if (status !== 503 || attempt === maxAttempts) {
        throw error;
      }

      // 1 seconde, puis 2 secondes.
      await wait(attempt * 1000);
    }
  }
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Le message est obligatoire.",
      });
    }

    console.log("Message reçu :", message);

    // Conversion de notre historique au format Gemini.
    const contents = history.map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: item.text,
        },
      ],
    }));

    // Ajout du nouveau message.
    contents.push({
      role: "user",
      parts: [
        {
          text: message,
        },
      ],
    });

    const response = await generateWithRetry(contents);

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

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});