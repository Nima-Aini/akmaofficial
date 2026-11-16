import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const baseUrl = process.env.AKMA_VISUAL_BASE_URL ?? "http://127.0.0.1:34591";
if (new URL(baseUrl).hostname !== "127.0.0.1") throw new Error("Visual capture must target the isolated local server.");
const output = path.resolve("visual-screenshots");
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(os.tmpdir(), "akma-visual-chrome-"));
const executable = process.env.CHROME_PATH ?? "google-chrome";
const chrome = spawn(executable, [
  "--headless=new", "--no-sandbox", "--no-first-run", "--no-default-browser-check",
  "--disable-gpu", "--disable-dev-shm-usage",
  "--remote-allow-origins=*", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
let startupError = "";
chrome.stderr.on("data", (chunk) => { startupError = (startupError + chunk.toString()).slice(-2000); });

async function waitForPort() {
  for (let attempt = 0; attempt < 450; attempt++) {
    if (chrome.exitCode !== null) throw new Error(`Chrome exited before DevTools readiness: ${startupError}`);
    try {
      const portFile = await readFile(path.join(profile, "DevToolsActivePort"), "utf8");
      return Number(portFile.split("\n")[0]);
    } catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
  }
  throw new Error(`Chrome DevTools did not start (exit=${chrome.exitCode}, profile=${(await readdir(profile)).join(",")}): ${startupError}`);
}

async function capture(port, name, url, width) {
  const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  if (!target.ok) throw new Error(`Could not open Chrome tab: ${target.status}`);
  const { id: tabId, webSocketDebuggerUrl } = await target.json();
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    const current = pending.get(message.id);
    if (!current) return;
    pending.delete(message.id);
    if (message.error) current.reject(new Error(JSON.stringify(message.error)));
    else current.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 30_000);
    pending.set(id, { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (error) => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
  try {
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    const navigation = await send("Page.navigate", { url });
    assert.ok(!navigation.errorText, `${name}: navigation failed: ${navigation.errorText}`);
    let page;
    for (let attempt = 0; attempt < 300; attempt++) {
      const response = await send("Runtime.evaluate", { expression: `({ready:document.readyState,url:location.href,bodyChars:document.body?.innerText.length ?? 0,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,cards:document.querySelectorAll('[data-responsive-product-media]').length,gallery:document.querySelectorAll('[data-responsive-product-gallery]').length})`, returnByValue: true });
      page = response.result?.value;
      if (page?.ready !== "loading" && page?.url === url && page.bodyChars > 100 && (name === "home" || page.cards > 0 || page.gallery > 0)) break;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    assert.ok(page?.ready !== "loading" && page?.url === url && page.bodyChars > 100, `${name}: page content did not load (${JSON.stringify(page)})`);
    assert.equal(page.width, width, `${name}: viewport width mismatch`);
    assert.ok(page.scrollWidth <= width + 2, `${name}: horizontal overflow (${page.scrollWidth}px at ${width}px)`);
    if (name.includes("catalog")) assert.ok(page.cards > 0, `${name}: missing product cards`);
    if (name.includes("detail")) assert.ok(page.gallery > 0, `${name}: missing product gallery`);
    await send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => true)", awaitPromise: true });
    const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    const png = Buffer.from(data, "base64");
    assert.equal(png.readUInt32BE(16), width, `${name}: screenshot viewport mismatch`);
    const filename = `${name}-${width}.png`;
    await writeFile(path.join(output, filename), png);
    console.log(`${filename}: ${page.cards} cards; no horizontal overflow`);
  } finally {
    socket.close();
    await fetch(`http://127.0.0.1:${port}/json/close/${tabId}`).catch(() => {});
  }
}

try {
  const port = await waitForPort();
  const pages = [
    ["home", "/"], ["retail-catalog", "/products?mode=retail"],
    ["wholesale-catalog", "/products?mode=wholesale"],
  ];
  for (const width of [360, 390, 430, 768, 1024, 1440]) {
    for (const [name, route] of pages) await capture(port, name, `${baseUrl}${route}`, width);
    if (width === 390 || width === 1440) {
      for (const mode of ["retail", "wholesale"]) {
        await capture(port, `${mode}-detail`, `${baseUrl}/products/foam-cleaner-retail?mode=${mode}`, width);
      }
    }
  }
} finally {
  chrome.kill("SIGTERM");
  if (chrome.exitCode === null) {
    await Promise.race([
      new Promise((resolve) => chrome.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
  }
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
