// Import dependencies
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  UploadPartCommand,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import "dotenv/config";
import CustomError from "../utils/customError.js";
import sendResponse from "../utils/sendResponse.js";
import { pipeline } from "stream"
import { promisify } from "util"
const pipelineAsync = promisify(pipeline);


// Configure AWS credentials
const accessKeyId = process.env.AWS_ACCESS_KEY_1;
const secretAccessKey = process.env.AWS_SECRET_KEY_1;


const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function uploadPartToS3(uploadId, s3Key, partNumber, partData) {
  console.log(`Uploading part ${partNumber}...`);

  const uploadResponse = await s3.send(
    new UploadPartCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: s3Key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: partData,
    })
  );

  console.log(`Part ${partNumber} uploaded.`);
  return uploadResponse;
}

// Function to upload a file to S3
async function uploadFile(req, rootFolder) {
  let data = [];

  if (req.files.image.length > 0) {
    for (let i = 0; i < req.files.image.length; i++) {
      const extension = req.files.image[i].name.split(".").pop();
      const uniqueName = `${rootFolder}/${Math.round(
        Math.random() * 1000
      )}${Date.now()}${Math.round(Math.random() * 10000)}.${extension}`;

      // Create a PutObjectCommand to upload the file
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME_2,
        Body: req.files.image[i].data,
        Key: uniqueName,
        ContentType: req.files.image[i].mimetype,
      });

      await s3.send(uploadCommand);
      const url = `https://${process.env.BUCKET_NAME_2}.s3.ap-south-1.amazonaws.com/${uniqueName}`;

      data.push(url);
    }
  } else {
    const extension = req.files.image.name.split(".").pop();
    const uniqueName = `${rootFolder}/${Math.round(
      Math.random() * 1000
    )}${Date.now()}${Math.round(Math.random() * 10000)}.${extension}`;

    // Create a PutObjectCommand to upload the file
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME_2,
      Key: uniqueName,
      Body: req.files.image.data,
      ContentType: req.files.image.mimetype,
    });

    await s3.send(uploadCommand);
    const url = `https://${process.env.BUCKET_NAME_2}.s3.ap-south-1.amazonaws.com/${uniqueName}`;

    data.push(url);
  }

  return data;
}

async function uploadFileForTeleCallerLeads(req, rootFolder) {
  const data = [];

  const images = Array.isArray(req.files.image)
    ? req.files.image
    : [req.files.image]; // ensure always array

  for (const file of images) {
    const originalName = file.name;
    const extension = originalName.split(".").pop();
    const uniqueName = `${rootFolder}/${Math.round(
      Math.random() * 1000
    )}${Date.now()}${Math.round(Math.random() * 10000)}.${extension}`;

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME_2,
      Key: uniqueName,
      Body: file.data,
      ContentType: file.mimetype,
    });

    await s3.send(uploadCommand);

    const url = `https://${process.env.BUCKET_NAME_2}.s3.ap-south-1.amazonaws.com/${uniqueName}`;

    data.push({ name: originalName, url });
  }

  return data;
}

// Function to generate a presigned URL for uploading
const putPreSignedUrl = async (req, res, next) => {
  try {
    const { key, fileType } = req.body;

    // Command to put object
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    // Create a presigned URL
    const preSigned = await getSignedUrl(s3, command, {
      expiresIn: 60 * 60 * 24,
    });

    return sendResponse(res, 200, preSigned);
  } catch (err) {
    console.log(err);
    return next(new CustomError());
  }
};

const putPreSignedUrlPublic = async (req, res, next) => {
  try {
    const { key, fileType } = req.body;

    // Command to put object
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME_2,
      Key: key,
      ContentType: fileType,
    });

    // Create a presigned URL
    const preSigned = await getSignedUrl(s3, command, {
      expiresIn: 60 * 60 * 24,
    });

    return sendResponse(res, 200, preSigned);
  } catch (err) {
    console.log(err);
    return next(new CustomError());
  }
};

export const getPreSignedUrl = async (key) => {
  try {
    // check if the key is in redis or not
    // const isMember = await client.get(`VIDEO:${key}`)

    // if(isMember) {
    //     const signedUrl = await client.get(`VIDEO:${key}` )
    //     console.log("signedUrl---------", signedUrl)
    //     return signedUrl;
    // }

    // command to get object
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
    });

    // create a presigned url
    const preSigned = await getSignedUrl(s3, command, {
      expiresIn: 60 * 60 * 10,
    });

    // await client.set(`VIDEO:${key}`, preSigned)
    return preSigned;
  } catch (err) {
    return null;
  }
};

export { putPreSignedUrl, uploadFile, putPreSignedUrlPublic , uploadFileForTeleCallerLeads};
