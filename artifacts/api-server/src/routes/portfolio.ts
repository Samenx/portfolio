import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { Router, type Request, type Response } from "express";

const router = Router();
const COOKIE_NAME = "samen_admin";
const maxAgeSeconds = 60 * 60 * 12;
const contentFile = process.env.CONTENT_STORE_PATH ?? path.resolve(process.cwd(), "data", "portfolio-content.json");

function requiredSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "samen-pc-admin-session-secret-change-this-before-public-deployment";
}

function signature(value: string) {
  return createHmac("sha256", requiredSecret()).update(value).digest("base64url");
}

function sessionValue() {
  const expires = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  return `${expires}.${signature(String(expires))}`;
}

function isAuthenticated(request: Request) {
  const cookie = request.headers.cookie?.split("; ").find((value) => value.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!cookie) return false;
  const [expires, receivedSignature] = cookie.split(".");
  if (!expires || !receivedSignature || Number(expires) < Date.now() / 1000) return false;
  const expectedSignature = signature(expires);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function requireAdmin(request: Request, response: Response) {
  if (isAuthenticated(request)) return true;
  response.status(401).json({ message: "Administrator sign-in required." });
  return false;
}

async function readContent() {
  try {
    return JSON.parse(await readFile(contentFile, "utf8")) as { content: unknown; updatedAt: string };
  } catch (error: unknown) {
    if (typeof error === "object" && error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

async function writeContent(content: unknown) {
  const updatedAt = new Date().toISOString();
  await mkdir(path.dirname(contentFile), { recursive: true });
  const temporaryFile = `${contentFile}.tmp`;
  await writeFile(temporaryFile, JSON.stringify({ content, updatedAt }, null, 2), "utf8");
  await rename(temporaryFile, contentFile);
  return updatedAt;
}

router.get("/portfolio", async (_request, response) => {
  const saved = await readContent();
  response.json(saved ?? { content: null, updatedAt: null });
});

router.get("/admin/session", (request, response) => response.json({ authenticated: isAuthenticated(request) }));

router.post("/admin/login", (request, response) => {
  const password = process.env.ADMIN_PASSWORD ?? "2005";
  if (typeof request.body?.password !== "string") { response.status(401).json({ message: "Invalid administrator password." }); return; }
  const input = Buffer.from(request.body.password);
  const expected = Buffer.from(password);
  if (input.length !== expected.length || !timingSafeEqual(input, expected)) { response.status(401).json({ message: "Invalid administrator password." }); return; }
  response.cookie(COOKIE_NAME, sessionValue(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: maxAgeSeconds * 1000, path: "/api" });
  response.json({ authenticated: true });
});

router.post("/admin/logout", (_request, response) => {
  response.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api" });
  response.status(204).end();
});

router.put("/portfolio", async (request, response) => {
  if (!requireAdmin(request, response)) return;
  if (!request.body?.content || typeof request.body.content !== "object" || Array.isArray(request.body.content)) { response.status(400).json({ message: "A portfolio content object is required." }); return; }
  const updatedAt = await writeContent(request.body.content);
  response.json({ content: request.body.content, updatedAt });
});

export default router;
