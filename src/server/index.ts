import "dotenv/config";
import express from "express";
import cors from "cors";
import { researchRouter } from "./routes/research";
import { sessionsRouter } from "./routes/sessions";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/research", researchRouter);
app.use("/api/sessions", sessionsRouter);

// ─── Health ───────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => res.json({ ok: true }));

// ─── Global error handler ─────────────────────────────────────────────────────

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[server] unhandled error", err);
    res.status(500).json({ error: err.message ?? "Internal server error" });
  }
);

// ─── Boot ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});

export default app;