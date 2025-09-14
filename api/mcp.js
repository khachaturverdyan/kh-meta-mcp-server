import fetch from "node-fetch";

export default async function handler(req, res) {
  const token = process.env.META_ACCESS_TOKEN;
  const apiVersion = process.env.META_API_VERSION || "v20.0";

  const tools = {
    search: {
      name: "search",
      description: "List ad accounts linked to the access token",
      input_schema: { type: "object", properties: {} }
    },
    fetch: {
      name: "fetch",
      description: "Fetch insights for a given campaign ID",
      input_schema: {
        type: "object",
        properties: { campaign_id: { type: "string" } },
        required: ["campaign_id"]
      }
    }
  };

  if (req.method === "GET") {
    return res.status(200).json({
      mcp: "1.0",
      tools: Object.values(tools)
    });
  }

  if (req.method === "POST") {
    let body = {};
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    const { tool, input } = body || {};

    try {
      if (tool === "search") {
        const resp = await fetch(
          `https://graph.facebook.com/${apiVersion}/me/adaccounts?fields=name,account_id`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await resp.json();
        return res.status(200).json({ output: data });
      }

      if (tool === "fetch") {
        const resp = await fetch(
          `https://graph.facebook.com/${apiVersion}/${input.campaign_id}/insights?fields=campaign_name,impressions,clicks,spend`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await resp.json();
        return res.status(200).json({ output: data });
      }

      return res.status(400).json({ error: "Unknown tool" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).end();
}
