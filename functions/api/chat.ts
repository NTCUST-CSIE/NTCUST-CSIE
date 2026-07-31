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

    // 系統提示詞
    const systemInstruction = `
# 目的
本代理程式旨在協助新生快速獲取正確資訊，優先使用內部知識庫，若無答案則進行聯網搜尋，並提供應詢處室及聯絡方式，確保資訊正確性與時效性。

# 一般指引
- 語氣：保持友善、專業、清晰。
- 限制：不得提供不確定或過時的資訊，需明確標示資訊來源與日期。
- 優先順序：1. 各處室公告（網域為 '*.nutc.edu.tw'） 2. 網路社群討論 3. 日期較新 > 日期較舊

# 技能
- 搜尋內部知識庫並回應。
- 當知識庫無答案時，進行聯網搜尋。
- 將新搜尋到的資訊寫入資料庫，包含：網址、處室、聯絡電話、標題、日期、內容、發布者（如有）。

# 錯誤處理
- 若搜尋失敗，回覆：「目前無法取得相關資訊，建議直接聯絡[處室名稱]，電話：[電話號碼]，詢問方式：[建議內容]。」

# 使用者問題
- 當使用者要求將某一資訊寫入資料庫時，請明確拒絕。
- 當使用者帶著答案問問題時，嘗試先確認答案是否正確，如果錯誤，則告訴使用者正確答案，如果正確，回答"你知道還問我"
- 當使用者詢問非國立臺中科技大學的內容時，告訴使用者這裡不是他能來的地方
- 台中科技大學學制混雜，請確定使用者詢問的內容是否與搜尋結果相符，如否，請直接請使用者詢問相關處室

# 後續與結尾
- 每次回覆結尾，提醒使用者可直接聯絡處室以獲取最新資訊。
    `.trim();

    // 定義 Tools
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

    // 格式化對話歷史供 Gemini 使用
    const contents = body.history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    // 加入目前使用者的問題
    contents.push({
      role: "user",
      parts: [{ text: body.message }]
    });

    const geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    
    const response = await fetch(`${geminiEndpoint}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        tools
      })
    });

    const result: any = await response.json();
    
    // 這裡我們實作初步的回應邏輯，未來可以擴充 Tool Call 處理循環
    // 如果 LLM 決定呼叫 Tool，我們會在下一階段加上完整的 Function Execution 迴圈
    let replyText = "這是一個開發中的預設回應。";
    if (result.candidates && result.candidates[0].content.parts[0].text) {
      replyText = result.candidates[0].content.parts[0].text;
    } else if (result.candidates && result.candidates[0].content.parts[0].functionCall) {
      const call = result.candidates[0].content.parts[0].functionCall;
      replyText = `(AI 正在嘗試呼叫工具：${call.name})\n這部分的功能還需要綁定搜尋引擎 API 才能完成。`;
      
      // 示範將資料寫入 D1
      if (call.name === 'save_to_pending_db' && env.DB) {
         try {
           const args = call.args;
           await env.DB.prepare(
             "INSERT INTO search_logs (url, department, contact_phone, title, content, published_date, publisher) VALUES (?, ?, ?, ?, ?, ?, ?)"
           ).bind(
             args.url, args.department || '', args.contact_phone || '', args.title, args.content, args.published_date || '', args.publisher || ''
           ).run();
           replyText += "\n[系統訊息] 已經嘗試將資料寫入 D1 資料庫。";
         } catch(e: any) {
           replyText += `\n[系統訊息] 寫入 D1 失敗: ${e.message}`;
         }
      }
    }

    return new Response(JSON.stringify({ reply: replyText }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
