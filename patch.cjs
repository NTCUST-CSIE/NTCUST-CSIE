const fs = require('fs');

const path = 'functions/api/chat.ts';
let code = fs.readFileSync(path, 'utf8');

const targetBlockStart = `    // Function Call Execution Loop
    if (result.candidates && result.candidates[0].content.parts[0].functionCall) {
      const call = result.candidates[0].content.parts[0].functionCall;`;

const targetBlockEnd = `      // 第二次呼叫 Gemini，讓它根據工具回傳的結果生成最終文字回覆
      const response2 = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: systemInstruction }] }, contents, tools })
      });
      result = await response2.json();
    }`;

const oldBlock = code.substring(code.indexOf(targetBlockStart), code.indexOf(targetBlockEnd) + targetBlockEnd.length);

const newBlock = `    // Function Call Execution Loop (Up to 3 iterations)
    let maxIterations = 3;
    let iteration = 0;
    
    while (iteration < maxIterations) {
      iteration++;
      
      if (result.error || !result.candidates || result.candidates.length === 0) {
        break;
      }
      
      const part = result.candidates[0].content.parts[0];
      
      if (part.text) {
        break; // AI 給出文字了，結束迴圈
      } else if (part.functionCall) {
        const call = part.functionCall;
        const callName = call.name;
        const args = call.args;
        
        let functionResultData: any = { error: "Unknown function" };

        if (callName === 'search_nutc_web') {
          if (!env.GOOGLE_SEARCH_API_KEY || !env.GOOGLE_SEARCH_ENGINE_ID) {
            functionResultData = { error: "搜尋失敗：管理員尚未設定 Google Search API Key。" };
          } else {
            try {
              const cx = env.GOOGLE_SEARCH_ENGINE_ID;
              const key = env.GOOGLE_SEARCH_API_KEY;
              const q = encodeURIComponent(args.query);
              const searchUrl = \`https://customsearch.googleapis.com/customsearch/v1?key=\${key}&cx=\${cx}&q=\${q}\`;
              const searchRes = await fetch(searchUrl, {
                headers: {
                  "Referer": "https://nutccsie.org/"
                }
              });
              const searchData: any = await searchRes.json();
              
              if (searchData.items) {
                functionResultData = searchData.items.map((item: any) => ({
                  title: item.title,
                  link: item.link,
                  snippet: item.snippet
                })).slice(0, 3);
              } else {
                functionResultData = { message: "No results found." };
              }
            } catch (e: any) {
              functionResultData = { error: e.message };
            }
          }
        } else if (callName === 'save_to_pending_db') {
          if (env.DB) {
            try {
              await env.DB.prepare(
                "INSERT INTO search_logs (url, department, contact_phone, title, content, published_date, publisher) VALUES (?, ?, ?, ?, ?, ?, ?)"
              ).bind(
                args.url, args.department || '', args.contact_phone || '', args.title, args.content, args.published_date || '', args.publisher || ''
              ).run();
              functionResultData = { status: "Success", message: "資料已寫入資料庫待審核。" };
            } catch(e: any) {
              functionResultData = { error: e.message };
            }
          } else {
            functionResultData = { error: "DB binding not found." };
          }
        } else if (callName === 'search_internal_kb') {
           functionResultData = { message: "知識庫目前為空，請嘗試其他搜尋方式。" };
        }

        // 將 AI 回傳的 functionCall 放進 contents
        contents.push(result.candidates[0].content);
        
        // 將執行結果以 functionResponse 的形式傳回給 AI
        contents.push({
          role: "user",
          parts: [{
            functionResponse: {
              name: callName,
              response: { name: callName, content: functionResultData }
            }
          }]
        });

        // 再次呼叫 Gemini，讓它根據工具回傳的結果生成最終文字回覆 (或是決定呼叫下一個工具)
        const responseNext = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: systemInstruction }] }, contents, tools })
        });
        result = await responseNext.json();
      } else {
        break; // 未知的 response 格式
      }
    }`;

code = code.replace(oldBlock, newBlock);
fs.writeFileSync(path, code);
console.log('Successfully patched chat.ts');
