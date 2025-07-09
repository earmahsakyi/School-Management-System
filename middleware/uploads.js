// uploads.js (final version)
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const createError = require('http-errors');

const uploadDir = path.join(__dirname, '../uploads/admins/');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    if (!req.user?.id) {
      return cb(createError(401, 'User not authenticated'), false);
    }
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `provider-${req.user.id}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('Processing file:', file.originalname);
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (validTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(400, 'Only JPEG, PNG, GIF or WebP images allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter
});

module.exports = upload; // Just export the multer instance