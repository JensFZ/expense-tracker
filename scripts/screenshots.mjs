import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public/screenshots");
const BASE = process.env.APP_URL ?? "http://localhost:3000";
const CREDS = {
  username: process.env.APP_USER ?? "",
  password: process.env.APP_PASS ?? "",
};

if (!CREDS.username || !CREDS.password) {
  console.error("Fehler: APP_USER und APP_PASS müssen gesetzt sein.");
  console.error("  Beispiel: APP_USER=admin APP_PASS=geheim node scripts/screenshots.mjs");
  process.exit(1);
}

async function shot(page, name, setup) {
  if (setup) await setup(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
  console.log(`✓ ${name}.png`);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

// Login
await page.goto(`${BASE}/login`);
await page.waitForSelector("#username", { timeout: 10000 });
await page.fill("#username", CREDS.username);
await page.fill("#password", CREDS.password);
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(800);

// Dashboard
await shot(page, "01-dashboard");

// Ausgaben
await page.goto(`${BASE}/expenses`);
await page.waitForLoadState("networkidle");
await shot(page, "02-ausgaben");

// Ausgaben – Suche aktiv
await shot(page, "03-ausgaben-suche", async (p) => {
  await p.fill('input[placeholder="Suchen…"]', "Rewe");
  await p.waitForTimeout(500);
});

// Ausgabe hinzufügen
await page.goto(`${BASE}/add`);
await page.waitForLoadState("networkidle");
await shot(page, "04-ausgabe-hinzufuegen");

// Firma-Autocomplete aufklappen
await shot(page, "05-firma-autocomplete", async (p) => {
  const firmInput = p.locator('input[placeholder="z.B. Rewe, Amazon, …"]');
  await firmInput.click();
  await p.waitForTimeout(400);
});

// Wiederkehrend
await page.goto(`${BASE}/recurring`);
await page.waitForLoadState("networkidle");
await shot(page, "06-wiederkehrend");

// Konten
await page.goto(`${BASE}/accounts`);
await page.waitForLoadState("networkidle");
await shot(page, "07-konten");

// Einstellungen
await page.goto(`${BASE}/settings`);
await page.waitForLoadState("networkidle");
await shot(page, "08-einstellungen");

// Import-Dialog öffnen
await page.goto(`${BASE}/expenses`);
await page.waitForLoadState("networkidle");
await shot(page, "09-import-dialog", async (p) => {
  const btn = p.locator('button', { hasText: /import/i }).first();
  if (await btn.isVisible()) {
    await btn.click();
    await p.waitForTimeout(500);
  }
});

await browser.close();
console.log("\nAlle Screenshots gespeichert in public/screenshots/");
