const app = require("express")();
const axios = require("axios");

let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("chrome-aws-lambda");
  puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer");
}

app.get("/api", async (req, res) => {
  let options = {};

  if (!req.query.bookingId) {
    throw "Need bookingId parameter";
  }

  if (!req.query.url) {
    throw "Need query parameter";
  }

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
    let browser = await puppeteer.launch(options);
    let page = await browser.newPage();
    await page.goto(url, {
      waitUntil: "networkidle0",
    });
    const buffer = await page.pdf({ format: "a4" });
    console.log("PDF Saved");
    res
      .send({
        message: "PDF Generated",
        s3Url: `https://gadjah-ticketing-platform.s3.ap-southeast-1.amazonaws.com/${req.query.bookingId}.pdf`,
      })
      .status(200);
  } catch (err) {
    console.log(err);
    res.send({ message: "Request Failed", error: err });
    return null;
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

module.exports = app;
