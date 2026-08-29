import { createHmac, timingSafeEqual } from "node:crypto";

const cookieName = "samen_admin";
const contentPath = "content/portfolio-content.json";
const sessionDuration = 60 * 60 * 12;

const json = (value, init = {}) => new Response(JSON.stringify(value), {
  ...init,
  headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
});

const env = (name) => process.env[name] ?? "";

function githubHeaders() {
  const token = env("GITHUB_TOKEN");
  if (!token) throw new Error("GITHUB_TOKEN is not configured.");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function repository() {
  const value = env("GITHUB_REPOSITORY");
  if (!value.includes("/")) throw new Error("GITHUB_REPOSITORY must be in the form owner/repository.");
  return value;
}

async function githubContent() {
  const response = await fetch(`https://api.github.com/repos/${repository()}/contents/${contentPath}`, { headers: githubHeaders() });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub content request failed (${response.status}).`);
  const result = await response.json();
  return { sha: result.sha, value: JSON.parse(Buffer.from(result.content, "base64").toString("utf8")) };
}

async function saveGithubContent(content) {
  const current = await githubContent();
  const updatedAt = new Date().toISOString();
  const payload = Buffer.from(JSON.stringify({ content, updatedAt }, null, 2)).toString("base64");
  const response = await fetch(`https://api.github.com/repos/${repository()}/contents/${contentPath}`, {
    method: "PUT",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Update portfolio content from admin", content: payload, ...(current ? { sha: current.sha } : {}) }),
  });
  if (!response.ok) throw new Error(`GitHub content save failed (${response.status}).`);
  return updatedAt;
}

function sessionSignature(value) {
  const secret = env("ADMIN_SESSION_SECRET");
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured.");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function cookie(request, name) {
  const entry = request.headers.get("cookie")?.split("; ").find((value) => value.startsWith(`${name}=`));
  return entry?.slice(name.length + 1) ?? "";
}

function authenticated(request) {
  const [expires, signature] = cookie(request, cookieName).split(".");
  if (!expires || !signature || Number(expires) < Date.now() / 1000) return false;
  const expected = sessionSignature(expires);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

function loginCookie(request) {
  const expires = Math.floor(Date.now() / 1000) + sessionDuration;
  const value = `${expires}.${sessionSignature(String(expires))}`;
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionDuration}${secure}`;
}

function route(request) {
  const pathname = new URL(request.url).pathname;
  const functionPrefix = "/.netlify/functions/api";
  if (pathname.startsWith(functionPrefix)) return pathname.slice(functionPrefix.length) || "/";
  return pathname.startsWith("/api") ? pathname.slice(4) || "/" : pathname;
}

export default async (request) => {
  try {
    const path = route(request);

    if (request.method === "GET" && path === "/portfolio") {
      const saved = await githubContent();
      return json(saved?.value ?? { content: null, updatedAt: null });
    }

    if (request.method === "GET" && path === "/admin/session") return json({ authenticated: authenticated(request) });

    if (request.method === "POST" && path === "/admin/login") {
      const { password } = await request.json();
      const expected = env("ADMIN_PASSWORD");
      if (!expected || typeof password !== "string" || password !== expected) return json({ message: "Invalid administrator password." }, { status: 401 });
      return json({ authenticated: true }, { headers: { "Set-Cookie": loginCookie(request) } });
    }

    if (request.method === "PUT" && path === "/portfolio") {
      if (!authenticated(request)) return json({ message: "Administrator sign-in required." }, { status: 401 });
      const { content } = await request.json();
      if (!content || typeof content !== "object" || Array.isArray(content)) return json({ message: "A portfolio content object is required." }, { status: 400 });
      const updatedAt = await saveGithubContent(content);
      return json({ content, updatedAt });
    }

    return json({ message: "Not found." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process the request.";
    return json({ message }, { status: 500 });
  }
};
