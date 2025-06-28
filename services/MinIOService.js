const Minio = require("minio");

const MINIO_PORT = process.env.MINIO_PORT;
const MINIO_HOST = process.env.MINIO_HOST;
const BUCKET = process.env.BUCKET;
const MINIO_URL_BASE = process.env.MINIO_URL_BASE;

const minioClient = new Minio.Client({
  endPoint: MINIO_HOST,
  port: parseInt(MINIO_PORT),
  useSSL: true,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

//Policy for the bucket to allow public access read-only
const policy = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Principal: { AWS: ["*"] },
      Action: [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
      ],
      Resource: [`arn:aws:s3:::${BUCKET}`, `arn:aws:s3:::${BUCKET}/*`],
    },
  ],
};

// Check if the bucket exists
// If it doesn't, create it
const initializeBucket = async () => {
  const exists = await minioClient.bucketExists(BUCKET);
  if (!exists) {
    await minioClient.makeBucket(BUCKET);
    await minioClient.setBucketPolicy(BUCKET, JSON.stringify(policy));
  } else {
    console.info("MinIO bucket already exists.");
  }
};

// Upload audio file to MinIO
const uploadAudioToMinIO = async (filename) => {
  try {
    const url = await minioClient.presignedPutObject(BUCKET, filename);
    const fileUrl = `${MINIO_URL_BASE}/${filename}`;
    return { status: 200, data: { uploadUrl: url, fileUrl } };
  } catch (err) {
    throw new Error("Failed to get presigned URL");
  }
};

// Delete audio file from MinIO
const deleteFileFromMinIO = async (filename) => {
  try {
    await minioClient.removeObject(BUCKET, filename);
    return { status: 200, message: `${filename} file deleted successfully` };
  } catch (err) {
    throw new Error("Failed to delete file from MinIO");
  }
};

// Delete multiple audio files from MinIO
const deleteFilesFromMinIO = async (filenames) => {
  try {
    await minioClient.removeObjects(BUCKET, filenames);
    return { status: 200, message: `${filenames} files deleted successfully` };
  } catch (err) {
    throw new Error("Failed to delete files from MinIO");
  }
};

module.exports = {
  initializeBucket,
  uploadAudioToMinIO,
  deleteFileFromMinIO,
  deleteFilesFromMinIO,
};
