#!/usr/bin/env node
/**
 * Headless-browser check of dashboard pages: screenshots plus the numbers
 * that matter on phones. Built during the 2026-10-18 mobile cleanup.
 *
 *   node scripts/browser-check.mjs [options] [path ...]
 *     --base URL     default http://192.168.8.239:3001 (the dev container)
 *     --width N      viewport width, default 390 (phone; <640 also emulates touch)
 *     --height N     default 844
 *     --out DIR      screenshot folder, default screenshots/ (gitignored)
 *     --full         full-page screenshots (default: first screen only)
 *   No paths = every page in the nav.
 *
 * Signed-in pages need a session: `scripts/dev-session.sh create` writes
 * .dev-session, which is read here (or set HC_SESSION). Public pages (/login,
 * /signup) work without one. Run `scripts/dev-session.sh delete` afterwards.
 *
 * Per page it prints: load time, page height, horizontal overflow, content
 * wider than the screen that nothing clips (this made phones zoom the whole
 * site out once), tap targets under 32px, and text under 11px.
 *
 * Chromium: uses $CHROMIUM_PATH, else the newest headless shell under
 * ~/.cache/ms-playwright (install one with `npx playwright install
 * chromium-headless-shell` if missing).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";

const PAGES = [
  "/day",
  "/",
  "/sleep",
  "/sleep-debt",
  "/sleep-consistency",
  "/steps",
  "/calories",
  "/resting-heart-rate",
  "/hrv",
  "/skin-temperature",
  "/weight",
  "/recovery",
  "/healthspan",
  "/habits",
  "/explore",
  "/data-sources",
  "/settings",
];

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const [value] = args.splice(index, 2).slice(1);
  return value;
};
const full = args.includes("--full") && args.splice(args.indexOf("--full"), 1);
const base = option("--base", "http://192.168.8.239:3001");
const width = Number(option("--width", "390"));
const height = Number(option("--height", "844"));
const out = option("--out", "screenshots");
const paths = args.length ? args : PAGES;

function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const cache = join(homedir(), ".cache", "ms-playwright");
  if (!existsSync(cache)) return undefined;
  const shells = readdirSync(cache)
    .filter((name) => name.startsWith("chromium_headless_shell-"))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const shell of shells) {
    const binary = join(
      cache,
      shell,
      "chrome-headless-shell-linux64",
      "chrome-headless-shell",
    );
    if (existsSync(binary)) return binary;
  }
  return undefined;
}

const token =
  process.env.HC_SESSION ??
  (existsSync(".dev-session")
    ? readFileSync(".dev-session", "utf8").trim()
    : null);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: chromiumPath() });
const phone = width < 640;
const context = await browser.newContext({
  viewport: { width, height },
  isMobile: phone,
  hasTouch: phone,
});
if (token)
  await context.addCookies([{ name: "hc_session", value: token, url: base }]);
const page = await context.newPage();

for (const path of paths) {
  const started = Date.now();
  try {
    await page.goto(base + path, { timeout: 120_000 });
    await page.waitForLoadState("networkidle", { timeout: 60_000 });
  } catch (error) {
    console.log(`${path}  LOAD FAILED: ${error.message.split("\n")[0]}`);
    continue;
  }
  await page.waitForTimeout(1200);
  const landed = new URL(page.url()).pathname;
  if (landed !== path && !landed.startsWith(`${path}/`)) {
    // /login without a session, or /login -> / when already signed in.
    const hint =
      landed === "/login" ? " (no session? see scripts/dev-session.sh)" : "";
    console.log(`${path}  redirected to ${landed}${hint}; not measured`);
    continue;
  }
  const m = await page.evaluate(() => {
    const vw = window.innerWidth;
    const clipped = (element) => {
      for (
        let a = element.parentElement;
        a && a !== document.body;
        a = a.parentElement
      ) {
        if (getComputedStyle(a).overflowX !== "visible") return true;
      }
      return false;
    };
    const unclipped = [...document.querySelectorAll("body *")]
      .filter((e) => e.getBoundingClientRect().right > vw + 1 && !clipped(e))
      .slice(0, 3)
      .map(
        (e) =>
          `<${e.tagName.toLowerCase()}> "${e.textContent.trim().slice(0, 40)}" right=${Math.round(e.getBoundingClientRect().right)}`,
      );
    const taps = [
      ...document.querySelectorAll(
        "main a, main button, main input, main select, main [role=button]",
      ),
    ]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.height < 32 || r.width < 32);
      })
      .map(
        (e) =>
          `${(e.textContent || e.getAttribute("aria-label") || e.tagName).trim().slice(0, 20)} (${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)})`,
      );
    const tinyText = [...document.querySelectorAll("main *")].filter(
      (e) =>
        [...e.childNodes].some(
          (n) => n.nodeType === 3 && n.textContent.trim(),
        ) && parseFloat(getComputedStyle(e).fontSize) < 11,
    ).length;
    return {
      overflow: document.documentElement.scrollWidth - vw,
      height: document.documentElement.scrollHeight,
      unclipped,
      taps,
      tinyText,
    };
  });
  const file = join(
    out,
    `${path === "/" ? "overview" : path.slice(1).replaceAll("/", "_")}-${width}.png`,
  );
  await page.screenshot({ path: file, fullPage: Boolean(full) });
  console.log(
    `${path.padEnd(20)} ${String(Date.now() - started).padStart(6)}ms  h=${m.height}  overflow=${m.overflow}  smallTaps=${m.taps.length}  tinyText=${m.tinyText}  -> ${file}`,
  );
  for (const line of m.unclipped) console.log(`    UNCLIPPED ${line}`);
  for (const tap of m.taps.slice(0, 3)) console.log(`    small tap: ${tap}`);
}
await browser.close();
