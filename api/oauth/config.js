export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  return res.status(200).json({
    client_id: "dummy-client",
    client_secret: "dummy-secret",
    auth_url: "https://example.com/oauth/authorize",
    token_url: "https://example.com/oauth/token"
  });
}
