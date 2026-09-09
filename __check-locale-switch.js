const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const messages = [];
  page.on("console", (msg) => {
    messages.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => {
    messages.push(`[pageerror] ${err.message}`);
  });

  await page.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
  console.log("Loaded /en, heading:", await page.textContent("h1"));

  const buttons = await page.locator('button[data-slot="dropdown-menu-trigger"]').all();
  await buttons[0].click();
  await page.getByRole("menuitem", { name: /german|deutsch/i }).click();

  await page.waitForURL("**/de");
  await page.waitForTimeout(500);
  console.log("After switch, URL:", page.url());
  console.log("Heading:", await page.textContent("h1"));
  console.log("html lang:", await page.getAttribute("html", "lang"));

  console.log("\n--- Console/page messages during session ---");
  messages.forEach((m) => console.log(m));

  await browser.close();
})();
