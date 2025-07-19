import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cahData = null;

export async function loadCahData() {
  try {
    const jsonPath = path.join(__dirname, '..', 'data', 'cah-compact-indian.json');
    const raw = await fs.readFile(jsonPath, 'utf-8');
    cahData = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load cah-compact.json:", err.message);
  }
}

export function getRandomPrompt() {
  if (!cahData || !Array.isArray(cahData.black)) {
    return "No prompt available.";
  }

  const cards = cahData.black;
  const random = cards[Math.floor(Math.random() * cards.length)];
  return typeof random === "string" ? random : random.text || "Unnamed prompt";
}
