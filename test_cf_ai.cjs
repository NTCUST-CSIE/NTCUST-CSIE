const fetch = require('node-fetch') || globalThis.fetch;

async function test() {
  const token = "cfut_wUmiTLnkaqF0vrHxkFdvZgNSQyQ5SyJm22cC5QDu9186ae48";
  const url = "https://api.cloudflare.com/client/v4/accounts/01b79e1ddd1cb6957ba278a52bb49edb/ai/run";
  
  const body = {
    "model": "google/gemini-3.1-pro",
    "input": {
      "contents": [
        { "parts": [{ "text": "What is Cloudflare? Reply in 1 sentence." }], "role": "user" }
      ]
    }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "cf-aig-gateway-id": "default",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (e) {
    console.error(e);
  }
}

test();
