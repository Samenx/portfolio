import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In production, the API also serves the Vite build. Keeping the site and API
// on one origin means the admin session cookie and /api requests work without
// any CORS or proxy configuration.
const publicDir = process.env.FRONTEND_DIST_PATH ?? path.resolve(process.cwd(), "..", "samen-pc-portfolio", "dist", "public");
app.use(express.static(publicDir));
app.get("/{*splat}", (_request, response) => response.sendFile(path.join(publicDir, "index.html")));

export default app;
