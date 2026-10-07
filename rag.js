import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export function loadKnowledge() {
  return fs.readFileSync("./data/knowledge.txt", "utf-8");
}

export function splitIntoChunks(text) {
  return text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

export async function createEmbeddings(chunks) {
  const documents = [];

  for (const chunk of chunks) {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-2",
      contents: chunk,
      config: {
        outputDimensionality: 768,
      },
    });

    documents.push({
      text: chunk,
      embedding: response.embeddings[0].values,
    });
  }

  return documents;
}

export function cosineSimilarity(vectorA, vectorB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchRelevantChunks(question, documents) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: question,
    config: {
      outputDimensionality: 768,
    },
  });

  const questionEmbedding = response.embeddings[0].values;

  return documents
    .map((document) => ({
      text: document.text,
      score: cosineSimilarity(
        questionEmbedding,
        document.embedding
      ),
    }))
    .sort((a, b) => b.score - a.score);
}