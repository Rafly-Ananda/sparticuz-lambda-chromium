const app = require("express")();
require("dotenv").config();

const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const { uploadPdfToS3 } = require("./s3Uploader");

let browser;
let page;

async function init() {
  try {
    browser = await puppeteer.launch({
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      defaultViewport: chromium.defaultViewport,
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
    });
  } catch (e) {
    throw e;
  }
}

async function generatePdf(url, bookingId) {
  console.log("Generating PDF");
  try {
    page = await browser.newPage();
    await page.goto(url, {
      waitUntil: "networkidle0",
    });

    const buffer = await page.pdf({ format: "a4" });
    console.log("Generating PDF Success");
    await uploadPdfToS3(bookingId, buffer);
    console.log("Uploading PDF Success");
    return `https://gadjah-ticketing-platform.s3.ap-southeast-1.amazonaws.com/${bookingId}.pdf`;
  } catch (e) {
    throw e;
  }
}

app.get("/api/", async (req, res) => {
  try {
    if (!req.query.bookingId) {
      throw "Need bookingId parameter";
    }

    if (!req.query.url) {
      throw "Need query parameter";
    }

    const result = await generatePdf(req.query.url, req.query.bookingId);

    res.send({ message: "PDF Generated", s3Url: result }).status(200);
  } catch (err) {
    res.send({ message: "Request Failed", error: err });
    return null;
  }
});

app.listen(process.env.PORT || 5001, () => {
  init();
  console.log("Server started");
});

module.exports = app;
