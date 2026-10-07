import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// PHASE 3 : CONTEXTE ENRICHI

// Instructions permanentes qui définissent le comportement général du chatbot.
const SYSTEM_INSTRUCTION = `
Tu es un assistant pédagogique destiné à accompagner des étudiants dans leur apprentissage.

Ton rôle :
- Explique les notions de manière claire, progressive et pédagogique.
- Adapte tes explications au niveau de l'utilisateur.
- Aide l'utilisateur à comprendre ses erreurs au lieu de simplement lui donner une réponse.
- Utilise des exemples simples lorsque cela facilite la compréhension.
- Encourage le raisonnement et l'apprentissage autonome.
- Si l'utilisateur demande une explication étape par étape, décompose clairement ton explication.

Règles obligatoires :
- Réponds toujours entièrement en français, sauf si l'utilisateur demande explicitement une autre langue.
- Ne mélange pas le français et l'anglais dans une même réponse.
- Pour une question simple, réponds de manière courte et directe.
- Si l'utilisateur demande une réponse détaillée ou une explication, développe ta réponse de manière claire, structurée et pédagogique.
- N'ajoute pas d'informations inutiles qui ne répondent pas à la question.
- Tiens compte des informations données précédemment dans la conversation.
- Si une information concernant l'utilisateur est inconnue, dis que tu ne la connais pas au lieu de l'inventer.
`;
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(express.json());
app.use(express.static("public"));

// Modèles que le serveur peut essayer. Si le premier est indisponible ou a atteint son quota,on peut essayer le suivant.
const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
];
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// GESTION DES MODÈLES ET DES ERREURS

async function generateWithFallback(contents) {
  for (const model of MODELS) {

    // Jusqu'à 3 tentatives pour chaque modèle.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `Tentative avec ${model} (${attempt}/3)`
        );

        const response = await ai.models.generateContent({
          model: model,

          // PHASE 2 : historique + nouveau message.
          contents: contents,

          config: {
            // PHASE 3 : comportement permanent du chatbot.
            systemInstruction: SYSTEM_INSTRUCTION,

            maxOutputTokens: 1000,
          },
        });

        console.log(`Modèle utilisé : ${model}`);

        return response;

      } catch (error) {
        const status = error.status;

        console.error(
          `Erreur ${model} :`,
          status || error.message
        );

        // 503 = surcharge temporaire. On attend puis on réessaie le même modèle.
        if (status === 503) {
          if (attempt < 3) {
            await wait(attempt * 1000);
            continue;
          }

          // Après 3 échecs : on passe au modèle suivant.
          break;
        }

        // 429 = quota du modèle atteint. Réessayer immédiatement le même modèle n'est généralement pas utile.
        if (status === 429) {
          console.log(
            `Quota atteint pour ${model}. Passage au modèle suivant.`
          );

          break;
        }

        // Pour une autre erreur (401, 403, etc.), // on ne masque pas le problème.
        throw error;
      }
    }
  }

  throw new Error(
    "Aucun modèle Gemini n'est disponible pour le moment."
  );
}


// ROUTE DU CHAT


app.post("/api/chat", async (req, res) => {
  try {
    // PHASE 2 : CHAT + CONTEXTE

    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Le message est obligatoire.",
      });
    }

    console.log("Message reçu :", message);

    // Transformation de l'historique du navigateur au format attendu par Gemini.
    const contents = history.map((item) => ({
      role: item.role === "assistant" ? "model" : "user",

      parts: [
        {
          text: item.text,
        },
      ],
    }));

    // Ajout du nouveau message après l'historique.
    contents.push({
      role: "user",

      parts: [
        {
          text: message,
        },
      ],
    });

    // Envoi de l'historique + nouveau message à Gemini.
    const response =
      await generateWithFallback(contents);

    res.json({
      reply: response.text,
    });

  } catch (error) {
    console.error(
      "Erreur Gemini :",
      error.message || error
    );

    res.status(500).json({
      error:
        "Les modèles Gemini sont temporairement indisponibles.",
    });
  }
});


    

// DÉMARRAGE DU SERVEUR


app.listen(PORT, () => {
  console.log(
    `Serveur démarré sur http://localhost:${PORT}`
  );
});