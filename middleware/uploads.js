const multer = require('multer');
const path = require('path');
const fs = require('fs');
const createError = require('http-errors');

const makeStorage = (folder) => {
  const uploadDir = path.join(__dirname, `../uploads/${folder}/`);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      if (!req.user?.id) {
        return cb(createError(401, 'User not authenticated'), false);
      }
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `${req.user.id}-${Date.now()}${ext}`;
      cb(null, filename);
    }
  });
};

//  IMAGE file filter (for photo)
const imageFileFilter = (req, file, cb) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (validTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(400, 'Only image files allowed'), false);
  }
};

//  PDF file filter (for transcripts, report cards)
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(createError(400, 'Only PDF files are allowed'), false);
  }    
};


const makeUploader = (folder, fileType = 'image') =>
  multer({
    storage: makeStorage(folder),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileType === 'pdf' ? pdfFileFilter : imageFileFilter
  });

module.exports = makeUploader;
