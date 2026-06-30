import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // API proxy route to bypass browser CORS / Failed to fetch
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, session_id } = req.body;
      
      const targetUrl = 'https://ae0da470-0055-4470-82f8-36fec009c2c8-00-1p8qd4kencj42.sisko.replit.dev/api/chat';
      
      console.log(`[Proxy] Forwarding chat message for session: ${session_id}`);
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          session_id: session_id
        }),
      });

      if (!response.ok) {
        throw new Error(`External API returned status ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("[Proxy Error]:", error);
      res.status(500).json({ 
        error: error.message || "Failed to communicate with chat server" 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
