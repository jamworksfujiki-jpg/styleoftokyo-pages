import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext()).newPage();
await page.goto('https://styleoftokyo.jp/concept/', { waitUntil: 'domcontentloaded' });
const text = await page.evaluate(() => document.body.innerText);
console.log(text.slice(0, 4000));
await browser.close();
