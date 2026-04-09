const Minio = require('minio');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const MINIO_PORT = process.env.MINIO_PORT;
const MINIO_HOST = process.env.MINIO_HOST;
const BUCKET = process.env.BUCKET;
const MINIO_URL_BASE = process.env.MINIO_URL_BASE;

// Internal client — for bucket ops, delete, etc. (Docker network)
const minioClient = new Minio.Client({
  endPoint: MINIO_HOST,
  port: parseInt(MINIO_PORT, 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

// External client — for presigned URLs that browsers will access
const MINIO_EXTERNAL_HOST = process.env.MINIO_EXTERNAL_HOST || MINIO_HOST;
const MINIO_EXTERNAL_PORT = parseInt(process.env.MINIO_EXTERNAL_PORT || '443', 10);
const MINIO_EXTERNAL_USE_SSL = process.env.MINIO_EXTERNAL_USE_SSL !== 'false'; // default true

const externalMinioClient = new Minio.Client({
  endPoint: MINIO_EXTERNAL_HOST,
  port: MINIO_EXTERNAL_PORT,
  useSSL: MINIO_EXTERNAL_USE_SSL,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  region: 'us-east-1',
});

// Policy cho bucket
const policy = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { AWS: ['*'] },
      Action: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
      ],
      Resource: [`arn:aws:s3:::${BUCKET}`, `arn:aws:s3:::${BUCKET}/*`],
    },
  ],
};

// Khởi tạo bucket nếu chưa có
const initializeBucket = async () => {
  try {
    console.info(`Checking if bucket "${BUCKET}" exists at ${MINIO_HOST}:${MINIO_PORT} (SSL: ${process.env.MINIO_USE_SSL})...`);
    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) {
      console.info(`Bucket "${BUCKET}" does not exist. Creating...`);
      await minioClient.makeBucket(BUCKET);
      await minioClient.setBucketPolicy(BUCKET, JSON.stringify(policy));
      console.info(`Bucket "${BUCKET}" created and policy set.`);
    } else {
      console.info('MinIO bucket already exists.');
    }
  } catch (err) {
    console.error('Error in initializeBucket:', err);
    throw err;
  }
};

// Helper: build object key theo folder + tên file gốc
const buildObjectKey = (folder, originalFileName) => {
  const ext = path.extname(originalFileName) || '';
  const id = uuidv4();
  return `${folder}/${id}${ext}`;
};

// === AUDIO ===
const uploadAudioToMinIO = async (filename) => {
  try {
    const objectKey = buildObjectKey('audio', filename);
    let uploadUrl = await externalMinioClient.presignedPutObject(BUCKET, objectKey);
    
    // Map internal docker host to localhost for browser accessibility (Local Development Only)
    if (MINIO_URL_BASE.includes('127.0.0.1') || MINIO_URL_BASE.includes('localhost')) {
      uploadUrl = uploadUrl.replace('minio.local', '127.0.0.1');
    }

    const fileUrl = `${MINIO_URL_BASE}/${objectKey}`;

    return {
      status: 200,
      data: { uploadUrl, fileUrl, objectKey },
    };
  } catch (err) {
    console.error('uploadAudioToMinIO error:', err);
    throw new Error('Failed to get presigned URL for audio');
  }
};

// === IMAGE (NEW) ===
const uploadToMinIO = async (type = 'images', originalFileName) => {
  try {
    // objectKey: images/<uuid>.ext
    const objectKey = buildObjectKey(type, originalFileName);

    // Có thể truyền thêm expiry (giây) nếu muốn, vd: 60 * 5 = 5 phút
    let uploadUrl = await externalMinioClient.presignedPutObject(BUCKET, objectKey);

    // Map internal docker host to localhost for browser accessibility (Local Development Only)
    if (MINIO_URL_BASE.includes('127.0.0.1') || MINIO_URL_BASE.includes('localhost')) {
      uploadUrl = uploadUrl.replace('minio.local', '127.0.0.1');
    }

    const fileUrl = `${MINIO_URL_BASE}/${objectKey}`;

    return {
      status: 200,
      data: {
        uploadUrl, // FE PUT file lên đây
        fileUrl, // link public để lưu vào Question.ImageKeys
        objectKey, // nếu bạn muốn lưu key thay vì full url
      },
    };
  } catch (err) {
    console.error('uploadImageToMinIO error:', err);
    throw new Error('Failed to get presigned URL for image');
  }
};

// Delete 1 file
const deleteFileFromMinIO = async (filenameOrObjectKey) => {
  try {
    await minioClient.removeObject(BUCKET, filenameOrObjectKey);
    return {
      status: 200,
      message: `${filenameOrObjectKey} file deleted successfully`,
    };
  } catch (err) {
    throw new Error('Failed to delete file from MinIO');
  }
};

// Delete nhiều file
const deleteFilesFromMinIO = async (filenamesOrObjectKeys) => {
  try {
    await minioClient.removeObjects(BUCKET, filenamesOrObjectKeys);
    return {
      status: 200,
      message: `${filenamesOrObjectKeys.length} files deleted successfully`,
    };
  } catch (err) {
    throw new Error('Failed to delete files from MinIO');
  }
};

// Upload directly from server (buffer)
const uploadBufferToMinIO = async (folder, filename, buffer, mimetype) => {
  try {
    const objectKey = buildObjectKey(folder, filename);
    await minioClient.putObject(BUCKET, objectKey, buffer, {
      'Content-Type': mimetype,
    });
    const fileUrl = `${MINIO_URL_BASE}/${objectKey}`;
    return {
      status: 200,
      data: { fileUrl, objectKey },
    };
  } catch (err) {
    console.error('uploadBufferToMinIO error:', err);
    throw new Error('Failed to upload file to MinIO');
  }
};

module.exports = {
  initializeBucket,
  uploadAudioToMinIO,
  uploadToMinIO,
  deleteFileFromMinIO,
  deleteFilesFromMinIO,
  uploadBufferToMinIO,
};
