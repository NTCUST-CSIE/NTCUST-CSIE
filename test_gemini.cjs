const fs = require('fs');

async function test() {
  const envRaw = fs.readFileSync('.dev.vars', 'utf8');
  const env = {};
  envRaw.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2 && !line.startsWith('#')) {
      env[parts[0]] = parts.slice(1).join('=').replace(/"/g, '');
    }
  });

  const systemInstruction = `
# 目的
本代理程式旨在協助新生快速獲取正確資訊，優先使用內部知識庫，若無答案則進行聯網搜尋，並提供應詢處室及聯絡方式，確保資訊正確性與時效性。

# 技能
- 當知識庫無答案時，進行聯網搜尋。
  `;

  const tools = [
    {
      functionDeclarations: [
        {
          name: "search_nutc_web",
          description: "聯網搜尋國立臺中科技大學各處室公告 (*.nutc.edu.tw)。",
          parameters: {
            type: "OBJECT",
            properties: {
              query: { type: "STRING" }
            },
            required: ["query"]
          }
        }
      ]
    }
  ];

  const contents = [
    { role: "user", parts: [{ text: "請問資工科會辦公室在哪裡" }] }
  ];

  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${env.GEMINI_API_KEY}`;

  console.log("== FIRST CALL ==");
  let res = await fetch(geminiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: systemInstruction }] }, contents, tools })
  });
  let data = await res.json();
  console.log(JSON.stringify(data, null, 2));

  if (data.candidates && data.candidates[0].content.parts[0].functionCall) {
    const call = data.candidates[0].content.parts[0].functionCall;
    
    // Add model's functionCall to history
    contents.push(data.candidates[0].content);
    
    // Add user's functionResponse to history
    contents.push({
      role: "user",
      parts: [{
        functionResponse: {
          name: call.name,
          response: { name: call.name, content: { title: "資訊工程系辦公室", snippet: "系辦公室位於中商大樓 7 樓" } }
        }
      }]
    });

    console.log("\n== SECOND CALL ==");
    let res2 = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: systemInstruction }] }, contents, tools })
    });
    let data2 = await res2.json();
    console.log(JSON.stringify(data2, null, 2));
  }
}

test().catch(console.error);
