import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoBase64 = readFileSync(path.resolve(__dirname, '../public/logo.jpeg')).toString('base64');

const html = `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px;
    height: 630px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .logo-container {
    background: white;
    border-radius: 16px;
    padding: 30px 50px;
    margin-bottom: 40px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }
  .logo-container img {
    height: 80px;
    display: block;
  }
  .subtitle {
    color: rgba(255,255,255,0.9);
    font-size: 36px;
    font-weight: 300;
    letter-spacing: 2px;
  }
</style>
</head>
<body>
  <div class="logo-container">
    <img src="data:image/jpeg;base64,${logoBase64}" />
  </div>
  <div class="subtitle">Admin</div>
</body>
</html>`;

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630 });
await page.setContent(html, { waitUntil: 'load' });
await page.screenshot({
  path: path.resolve(__dirname, '../public/og-image.png'),
  type: 'png',
});
await browser.close();
console.log('OG image generated: public/og-image.png');
