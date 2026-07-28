import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

async function testTranslation() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("GEMINI_API_KEY length:", apiKey ? apiKey.length : 0);
  
  const payload = {
    prompt: "Translate the following text to PT. Return ONLY the translation. DO NOT add explanations. Text: Buscar piso en Oporto: Consejos útiles",
    history: [],
    action: "translate",
    language: "PT",
    userId: "amanda_user"
  };

  console.log("Calling local API at http://127.0.0.1:3001/api/chat...");
  try {
    const response = await fetch("http://127.0.0.1:3001/api/chat", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("Response body:", data);
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}

testTranslation();
