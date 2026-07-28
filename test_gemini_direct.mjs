import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

async function testDirect() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("GEMINI_API_KEY length:", apiKey ? apiKey.length : 0);
  if (!apiKey) return;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ role: "user", parts: [{ text: "Translate the following text to PT: Buscar piso en Oporto" }] }]
  };

  console.log("Calling Gemini directly at:", url);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("Response body:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Direct fetch failed:", err.message);
  }
}

testDirect();
