let puppeteer = null;
try {
  puppeteer = require("puppeteer");
} catch (_err) {
  // Puppeteer is optional
}

let browserInstance = null;

async function getBrowser() {
  if (!puppeteer) {
    throw new Error("Puppeteer no está instalado en el sistema");
  }
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });
  }
  return browserInstance;
}

module.exports = { getBrowser };
