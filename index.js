const app = require("express")();
require("dotenv").config();

const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

let browser;
let page;
let s3Client;

async function init() {
  try {
    browser = await puppeteer.launch({
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      defaultViewport: chromium.defaultViewport,
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
    });

    s3Client = new S3Client({
      region: process.env.AWS_BUCKET_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  } catch (e) {
    throw e;
  }
}

async function uploadPdfToS3(key, buffer) {
  console.log("Uploading PDfPDF");
  try {
    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${key}.pdf`,
      Body: buffer,
      ContentType: "application/pdf",
    };
    return await s3Client.send(new PutObjectCommand(s3Params));
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

app.listen(process.env.PORT || 5000, () => {
  init();
  console.log("Server started");
});

module.exports = app;
