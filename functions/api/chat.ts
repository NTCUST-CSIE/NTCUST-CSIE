export interface Env {
  GEMINI_API_KEY: string;
  GOOGLE_SEARCH_API_KEY?: string;
  GOOGLE_SEARCH_ENGINE_ID?: string;
  DB: D1Database;
  VECTORIZE_INDEX: VectorizeIndex;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json() as { message: string; history: any[] };

    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "API Key not configured" }), { status: 500 });
    }

    // 攔截日常對話，節省 API 成本
    const msgLower = body.message.trim().toLowerCase();
    
    // 移除常見標點符號以利比對
    const cleanMsg = msgLower.replace(/[，。！？、~！@#$%\^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, '');

    const greetings = ['你好', '哈囉', '嗨', 'hi', 'hello', '早安', '午安', '晚安', '安安'];
    const thanks = ['謝謝', '感謝', '感恩', 'thanks', 'thank you', 'thx', '謝啦'];
    const goodbyes = ['掰掰', '再見', '掰', 'bye', 'goodbye', 'see ya'];

    // 判斷是否為超短對話，且完全命中這些關鍵字
    if (cleanMsg.length <= 10) {
      if (greetings.some(g => cleanMsg === g || cleanMsg.includes(g) && cleanMsg.length <= g.length + 2)) {
        return new Response(JSON.stringify({ reply: "你好呀！我是中科大資訊工程科的專屬 AI 助理。請問有什麼我可以幫忙的嗎？" }), { headers: { 'Content-Type': 'application/json' }});
      }
      if (thanks.some(t => cleanMsg === t || cleanMsg.includes(t) && cleanMsg.length <= t.length + 2)) {
        return new Response(JSON.stringify({ reply: "不客氣！如果還有其他關於學校或註冊的問題，隨時歡迎發問喔！" }), { headers: { 'Content-Type': 'application/json' }});
      }
      if (goodbyes.some(g => cleanMsg === g || cleanMsg.includes(g) && cleanMsg.length <= g.length + 2)) {
        return new Response(JSON.stringify({ reply: "再見！祝你有個美好的一天，有問題隨時回來找我喔！" }), { headers: { 'Content-Type': 'application/json' }});
      }
    }

    const systemInstruction = `
【絕對規則】
1. 若使用者帶著答案發問：查證後若錯誤則糾正；若正確則回「你知道還問我」。
2. 若詢問非國立臺中科技大學之內容：直接拒答並回「這裡不是你能來的地方」。
3. 台中科大學制混雜，請核對搜尋結果與問題學制是否相符，不符請建議直接詢問相關處室。
4. 拒絕使用者主動要求的資料庫寫入。

# 目的與技能
協助新生獲取正確資訊。優先查內部知識庫，無則聯網搜尋(*.nutc.edu.tw)。提供應詢處室與聯絡電話。查獲新資訊需寫入資料庫待審。

# 回覆與錯誤處理
- 搜尋失敗回：「目前無法取得相關資訊，建議直接聯絡[處室]，電話：[電話]，詢問方式：[建議]。」
- 提供的資訊需附來源網址與日期。
- 結尾必提醒：可直接聯絡處室以獲最新資訊。
    `.trim();

    const tools = [
      {
        functionDeclarations: [
          {
            name: "search_internal_kb",
            description: "搜尋內部知識庫以獲取學校相關資訊。",
            parameters: {
              type: "OBJECT",
              properties: {
                query: { type: "STRING", description: "要搜尋的關鍵字" }
              },
              required: ["query"]
            }
          },
          {
            name: "search_nutc_web",
            description: "聯網搜尋國立臺中科技大學各處室公告 (*.nutc.edu.tw)。",
            parameters: {
              type: "OBJECT",
              properties: {
                query: { type: "STRING", description: "要搜尋的關鍵字" }
              },
              required: ["query"]
            }
          },
          {
            name: "save_to_pending_db",
            description: "將新搜尋到的資訊寫入資料庫供管理員審核。",
            parameters: {
              type: "OBJECT",
              properties: {
                url: { type: "STRING" },
                department: { type: "STRING", description: "處室名稱" },
                contact_phone: { type: "STRING" },
                title: { type: "STRING" },
                content: { type: "STRING" },
                published_date: { type: "STRING" },
                publisher: { type: "STRING" }
              },
              required: ["url", "department", "title", "content"]
            }
          }
        ]
      }
    ];

    const contents = body.history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    contents.push({ role: "user", parts: [{ text: body.message }] });

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${env.GEMINI_API_KEY}`;
    
    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: systemInstruction }] }, contents, tools })
    });
    let result: any = await response.json();
    
    // Function Call Execution Loop (Up to 3 iterations)
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
              const searchUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${q}`;
              
              // 取得真實的來源網址作為 Referer，若無則提供預設值
              const reqOrigin = request.headers.get("Origin") || request.headers.get("Referer") || "https://nutccsie.org";
              
              const searchRes = await fetch(searchUrl, {
                headers: {
                  "Referer": reqOrigin
                }
              });
              const searchData: any = await searchRes.json();
              
              if (searchData.error) {
                // 將 Google API 的錯誤訊息直接傳給 AI
                functionResultData = { error: `Google Search API 錯誤 (${searchData.error.code}): ${searchData.error.message}。請告訴使用者 Google API Key 權限被阻擋。` };
              } else if (searchData.items) {
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
    }

    let replyText = "抱歉，我目前無法回應，請稍後再試。";
    if (result.candidates && result.candidates[0].content.parts[0].text) {
      replyText = result.candidates[0].content.parts[0].text;
    } else if (result.error) {
      replyText = `API 錯誤: ${result.error.message}`;
    }

    return new Response(JSON.stringify({ reply: replyText }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
