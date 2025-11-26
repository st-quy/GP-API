const Minio = require('minio');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const MINIO_PORT = process.env.MINIO_PORT;
const MINIO_HOST = process.env.MINIO_HOST;
const BUCKET = process.env.BUCKET;
const MINIO_URL_BASE = process.env.MINIO_URL_BASE;

const minioClient = new Minio.Client({
  endPoint: MINIO_HOST,
  port: parseInt(MINIO_PORT, 10),
  useSSL: true,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
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
  const exists = await minioClient.bucketExists(BUCKET);
  if (!exists) {
    await minioClient.makeBucket(BUCKET);
    await minioClient.setBucketPolicy(BUCKET, JSON.stringify(policy));
  } else {
    console.info('MinIO bucket already exists.');
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
    const uploadUrl = await minioClient.presignedPutObject(BUCKET, objectKey);
    const fileUrl = `${MINIO_URL_BASE}/${objectKey}`;

    return {
      status: 200,
      data: { uploadUrl, fileUrl, objectKey },
    };
  } catch (err) {
    throw new Error('Failed to get presigned URL for audio');
  }
};

// === IMAGE (NEW) ===
const uploadToMinIO = async (type = 'images', originalFileName) => {
  try {
    // objectKey: images/<uuid>.ext
    const objectKey = buildObjectKey(type, originalFileName);

    // Có thể truyền thêm expiry (giây) nếu muốn, vd: 60 * 5 = 5 phút
    const uploadUrl = await minioClient.presignedPutObject(BUCKET, objectKey);

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

module.exports = {
  initializeBucket,
  uploadAudioToMinIO,
  uploadToMinIO, // 👈 NEW
  deleteFileFromMinIO,
  deleteFilesFromMinIO,
};
