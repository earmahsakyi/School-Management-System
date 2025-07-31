const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const createError = require('http-errors');
// const config = require('../config/default.json');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Local storage first (temp folder)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const userId = req.user?.id || 'anon';
    cb(null, `${userId}-${file.fieldname}-${Date.now()}${ext}`);
  },
});

// File filter
const s3FileFilter = (req, file, cb) => {
  const { fieldname, mimetype } = file;
  const isImage = fieldname === 'photo' && mimetype.startsWith('image/');
  const isPDF = ['transcript', 'reportCard', 'certificates'].includes(fieldname) && mimetype === 'application/pdf';
  if (isImage || isPDF) {
    cb(null, true);
  } else {
    cb(createError(400, 'Only image or PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter: s3FileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'transcript', maxCount: 1 },
  { name: 'reportCard', maxCount: 1 },
  { name: 'certificates', maxCount: 5 },
]);

// Upload to S3 manually
const uploadToS3 = async (file, role = 'common') => {
  const folder = role.toLowerCase(); 
  const key = `${folder}/${file.filename}`;

  const fileStats = fs.statSync(file.path);
  const fileStream = fs.createReadStream(file.path);
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: file.mimetype,
    ContentLength: fileStats.size,
  };

  await s3.send(new PutObjectCommand(uploadParams));
  fs.unlinkSync(file.path); // remove local file

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

module.exports = {
  upload,
  uploadToS3,
};

