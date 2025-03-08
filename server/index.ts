import express, { type Request, Response, NextFunction } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { type Server } from "http";
import { createServer as createViteServer, createLogger } from "vite";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { registerRoutes, setWebSocketManager } from "./routes/index";
import { db } from "./db";
import session from "express-session";
import passport from "passport";
import { categories } from "@shared/schema";
import cors from "cors";
import { requireAdmin, extendSession } from "./middleware";
import { storage } from "./storage";
import { WebSocketManager } from './websocket';

// Logger function
const viteLogger = createLogger();
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();

// API and JSON middleware
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));

// Static files serving - Updated for avatars
const avatarsPath = path.join(__dirname, "public", "avatars");
app.use("/avatars", express.static(avatarsPath));

// API request middleware
app.use("/api", (req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

// Session and auth middleware
const sessionConfig = {
  secret: process.env.REPLIT_ID || "development-secret-key",
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  name: "session_id",
  cookie: {
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    secure: app.get("env") === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
app.use(requireAdmin);
app.use(extendSession);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Increase event listener limit for PGStore
storage.sessionStore.setMaxListeners(20);

(async () => {
  try {
    // Port ayarını 3000 olarak güncelle
    const PORT = 3000;
    const { runDailyTasks } = await import("./scheduled-tasks");

    // Register API routes first
    const server = registerRoutes(app);

    // Initialize WebSocket manager
    const wsManager = new WebSocketManager(server);

    // Set global WebSocket manager
    setWebSocketManager(wsManager);

    // Clean up WebSocket connections on application shutdown
    process.on('SIGTERM', () => {
      console.log('Application shutting down, cleaning up WebSocket connections...');
      wsManager.close();
      server.close();
    });

    // Start scheduled task to run every 24 hours
    setInterval(runDailyTasks, 24 * 60 * 60 * 1000);
    // Run initial check
    runDailyTasks();

    // Create default categories
    const defaultCategories = [
      { name: "Yazılım Geliştirme", slug: "yazilim-gelistirme", order: 1 },
      { name: "Grafik Tasarım", slug: "grafik-tasarim", order: 2 },
      { name: "Dijital Pazarlama", slug: "dijital-pazarlama", order: 3 },
      { name: "Müşteri Hizmetleri", slug: "musteri-hizmetleri", order: 4 },
      { name: "İdari İşler", slug: "idari-isler", order: 5 },
      { name: "Eğitim", slug: "egitim", order: 6 },
      { name: "Sağlık", slug: "saglik", order: 7 },
      { name: "Finans", slug: "finans", order: 8 },
    ];

    for (const category of defaultCategories) {
      const existingCategory = await db.query.categories.findFirst({
        where: (categories, { eq }) => eq(categories.slug, category.slug),
      });

      if (!existingCategory) {
        await db.insert(categories).values(category);
      }
    }

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Add Vite middleware last
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server and wait for port binding
    await new Promise<void>((resolve) => {
      server.listen(PORT, "0.0.0.0", () => {
        log(`Server is running on port ${PORT}`);
        console.log(`Server is ready on port ${PORT}`);
        resolve();
      });
    });

    server.on("error", (error: any) => {
      if (error.code === "EADDRINUSE") {
        log(`Port ${PORT} is already in use. Trying another port...`);
        const newPort = PORT + 1;
        server.close();
        server.listen(newPort, "0.0.0.0", () => {
          log(`Server is now running on port ${newPort}`);
          console.log(`Server is ready on port ${newPort}`);
        });
      } else {
        console.error("Server error:", error);
      }
    });
  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }
})();

// Helper function for Vite setup
async function setupVite(app: express.Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Add Vite middleware last
  app.use(vite.middlewares);

  // Catch-all route for Vite
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

// Helper function for serving static files
function serveStatic(app: express.Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}