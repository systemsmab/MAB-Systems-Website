import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";

const url = process.argv[2] || "http://localhost:3000";
const label = process.argv[3];
const fullPage = !process.argv.includes("--viewport-only");
const widthArg = process.argv.find((a) => a.startsWith("--width="));
const viewportWidth = widthArg ? parseInt(widthArg.split("=")[1], 10) : 1440;

const dir = "./temporary screenshots";
fs.mkdirSync(dir, { recursive: true });

let n = 1;
while (fs.existsSync(path.join(dir, `screenshot-${n}${label ? "-" + label : ""}.png`))) {
  n++;
}
const filename = `screenshot-${n}${label ? "-" + label : ""}.png`;
const outPath = path.join(dir, filename);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: viewportWidth, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
await new Promise((r) => setTimeout(r, 300));

if (fullPage) {
  // Scroll through the page so scroll-triggered reveals (IntersectionObserver) fire
  // before Puppeteer's full-page capture, which doesn't scroll on its own.
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 400) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await new Promise((r) => setTimeout(r, 60));
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 400));
}

await page.screenshot({ path: outPath, fullPage });
await browser.close();

console.log(`Saved ${outPath}`);
