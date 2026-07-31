export interface Env {
  COPILOT_SECRET?: string;
  COPILOT_TOKEN_URL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    const { env } = context;

    // 1. Try Token URL first (No secret needed on our end, Copilot Studio handles it)
    if (env.COPILOT_TOKEN_URL) {
      const response = await fetch(env.COPILOT_TOKEN_URL, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Token URL returned ${response.status}: ${await response.text()}`);
      }
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Try Direct Line Secret fallback
    if (env.COPILOT_SECRET) {
      const response = await fetch('https://directline.botframework.com/v3/directline/tokens/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.COPILOT_SECRET}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Direct Line API returned ${response.status}: ${await response.text()}`);
      }
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Please configure COPILOT_TOKEN_URL or COPILOT_SECRET in Cloudflare Pages settings.');
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
