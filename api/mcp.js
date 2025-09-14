import fetch from "node-fetch";

export default async function handler(req, res) {
  // ✅ Always send CORS + JSON headers
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  // ✅ Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ✅ 🔑 API Key Authentication (add your API_KEY in Vercel env vars)
  const expectedKey = process.env.API_KEY;
  const authHeader = req.headers["authorization"];

  if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

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

  try {
    if (req.method === "GET") {
      console.log("MCP discovery requested");
      return res.status(200).json({
        mcp: "1.0",
        tools: Object.values(tools)
      });
    }

    if (req.method === "POST") {
      let body = {};
      try {
        body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      } catch (err) {
        console.error("Invalid JSON body:", req.body);
        return res.status(400).json({ error: "Invalid JSON body" });
      }

      const { tool, input } = body || {};
      console.log("MCP tool request:", tool, "input:", input);

      if (tool === "search") {
        const resp = await fetch(
          `https://graph.facebook.com/${apiVersion}/me/adaccounts?fields=name,account_id`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await resp.json();
        return res.status(200).json({ output: data });
      }

      if (tool === "fetch") {
        if (!input?.campaign_id) {
          return res.status(400).json({ error: "campaign_id is required" });
        }

        const resp = await fetch(
          `https://graph.facebook.com/${apiVersion}/${input.campaign_id}/insights?fields=campaign_name,impressions,clicks,spend`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await resp.json();
        return res.status(200).json({ output: data });
      }

      return res.status(400).json({ error: "Unknown tool" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
