const app = require("express")();
const axios = require("axios");
require("dotenv").config();

let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("chrome-aws-lambda");
  puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer");
}

let browser;
let page;

async function init() {
  let options = {};

  if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    options = {
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    };
  }

  try {
    browser = await puppeteer.launch(options);
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
    // await axios.post(`${process.env.S3_UPLOADER_SERVER}/api`, {
    //   bookingId,
    //   buffer,
    // });

    const pageTitle = await page.title();

    // return `https://gadjah-ticketing-platform.s3.ap-southeast-1.amazonaws.com/${bookingId}.pdf`;
    return pageTitle;
  } catch (e) {
    throw e;
  }
}

app.get("/api", async (req, res) => {
  try {
    if (!req.query.bookingId) {
      throw "Need bookingId parameter";
    }

    if (!req.query.url) {
      throw "Need query parameter";
    }

    const result = await generatePdf(req.query.url, req.query.bookingId);

    console.log("PDF Saved");
    res.send({ message: "PDF Generated", s3Url: result }).status(200);
  } catch (err) {
    console.log(err);
    res.send({ message: "Request Failed", error: err });
    return null;
  }
});

app.listen(process.env.PORT || 5002, () => {
  init();
  console.log("Server started");
});

module.exports = app;
