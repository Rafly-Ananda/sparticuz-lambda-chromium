require("dotenv").config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function uploadPdfToS3(key, buffer) {
  console.log("Uploading PDF");
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

module.exports = {
  uploadPdfToS3,
};
