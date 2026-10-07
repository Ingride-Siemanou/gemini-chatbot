import express from "express";
import { GoogleGenAI } from "@google/genai";
import {
  loadKnowledge,
  splitIntoChunks,
  createEmbeddings,
  searchRelevantChunks,
} from "./rag.js";

const app = express();
const PORT = 3000;

const SYSTEM_INSTRUCTION =
 `
 - Utilise naturellement les informations provenant de la base de connaissances sans mentionner le contexte, la base de connaissances, les chunks ou le RAG dans ta réponse, sauf si l'utilisateur pose directement une question sur ces sujets.
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

const knowledge = loadKnowledge();
const chunks = splitIntoChunks(knowledge);
const ragDocuments = await createEmbeddings(chunks);

app.use(express.json());
app.use(express.static("public"));

const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithFallback(contents) {
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Tentative avec ${model} (${attempt}/3)`);

        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
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

        if (status === 503) {
          if (attempt < 3) {
            await wait(attempt * 1000);
            continue;
          }

          break;
        }

        if (status === 429) {
          console.log(
            `Quota atteint pour ${model}. Passage au modèle suivant.`
          );

          break;
        }

        throw error;
      }
    }
  }

  throw new Error(
    "Aucun modèle Gemini n'est disponible pour le moment."
  );
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

    const contents = history.map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: item.text,
        },
      ],
    }));

    const relevantChunks = await searchRelevantChunks(
      message,
      ragDocuments
    );

    const ragContext = relevantChunks
      .slice(0, 3)
      .map((result) => result.text)
      .join("\n\n");

    contents.push({
      role: "user",
      parts: [
        {
          text: `
Contexte provenant de la base de connaissances :
${ragContext}

Question de l'utilisateur :
${message}
`,
        },
      ],
    });

    const response = await generateWithFallback(contents);

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

app.listen(PORT, () => {
  console.log(
    `Serveur démarré sur http://localhost:${PORT}`
  );
});