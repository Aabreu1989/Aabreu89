import dotenv from 'dotenv';
import handler from './api/chat.js';

dotenv.config({ path: '.env.local' });

async function testDirect() {
  const req = {
    method: 'POST',
    body: {
      prompt: "Translate the following text to PT: Buscar piso en Oporto",
      history: [],
      action: "translate",
      language: "PT",
      userId: "amanda_user"
    }
  };

  const res = {
    status(code) {
      console.log("Response Status:", code);
      return this;
    },
    json(data) {
      console.log("Response JSON:", JSON.stringify(data, null, 2));
      return this;
    }
  };

  console.log("Calling handler directly...");
  try {
    await handler(req, res);
  } catch (err) {
    console.error("Handler threw error:", err);
  }
}

testDirect();
