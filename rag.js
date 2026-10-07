import fs from "fs";

export function loadKnowledge() {
  return fs.readFileSync("./data/knowledge.txt", "utf-8");
}

export function splitIntoChunks(text) {
  return text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}