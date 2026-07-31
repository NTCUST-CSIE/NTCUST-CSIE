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
# 目的
本代理程式旨在協助新生快速獲取正確資訊，優先使用內部知識庫，若無答案則進行聯網搜尋，並提供應詢處室及聯絡方式，確保資訊正確性與時效性。

# 執行步驟 (非常重要)
第一步：【驗證問題】
  - 判斷使用者詢問的內容是否與「國立臺中科技大學」相關。若完全無關，請直接回覆：「這裡不是你能來的地方」，並停止任何搜尋。
  - 若使用者「帶著答案問問題」（例如：資工辦公室是不是在 7 樓？），請利用工具進行查證。查證後若錯誤，告訴使用者正確答案；若正確，請幽默地回覆：「你知道還問我」。
  - 當使用者要求將某一資訊寫入資料庫時，請明確拒絕，不要執行寫入動作。
第二步：【搜尋知識庫】
  - 呼叫 search_internal_kb 確認是否有現成答案。
第三步：【聯網搜尋】
  - 若知識庫無答案，呼叫 search_nutc_web 進行網域搜尋 (*.nutc.edu.tw)。
  - 必須確保能提供聯絡電話給使用者。若第一次搜尋未包含聯絡電話，請發動「第二次搜尋」尋找該處室的電話。
第四步：【核對與整理回覆】
  - 台中科技大學學制混雜，請嚴格核對搜尋結果是否完全符合使用者詢問的學制或問題。若不相符或找不到，請直接建議使用者詢問相關處室。
  - 不得提供不確定或過時的資訊，若有查到請明確標示資訊來源（網址）與日期。
  - 每次回覆結尾，都必須提醒使用者可直接聯絡該處室以獲取最新資訊。

# 一般指引
- 語氣：除了被觸發特殊回應外，平時保持友善、專業、清晰。

# 錯誤處理
- 若搜尋徹底失敗或無結果，回覆：「目前無法取得相關資訊，建議直接聯絡相關處室。電話：04-22195000（總機），詢問方式：可透過總機為您轉接。」
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
