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
        // You might want a more specific error or handling if user is not authenticated during file upload
        // For now, returning a 401 error. Ensure your auth middleware runs before multer.
        return cb(createError(401, 'User not authenticated'), false);
      }
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `${req.user.id}-${Date.now()}${ext}`;
      cb(null, filename);
    }
  });
};

// IMAGE file filter (for photo)
const imageFileFilter = (req, file, cb) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (validTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // It's good practice to log the invalid file type for debugging
    console.error(`Attempted upload with invalid image type: ${file.mimetype}`);
    cb(createError(400, 'Only image files allowed (JPEG, PNG, GIF, WEBP)'), false);
  }
};

// PDF file filter (for transcripts, report cards)
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    // It's good practice to log the invalid file type for debugging
    console.error(`Attempted upload with invalid PDF type: ${file.mimetype}`);
    cb(createError(400, 'Only PDF files allowed'), false);
  }
};

// makeUploader function (original function)
const makeUploader = (folder, type) => {
  const storage = makeStorage(folder);
  let fileFilter;
  if (type === 'image') {
    fileFilter = imageFileFilter;
  } else if (type === 'pdf') {
    fileFilter = pdfFileFilter;
  } else {
    // Default or error for unsupported types
    fileFilter = (req, file, cb) => cb(createError(400, 'Unsupported file type for this uploader'), false);
  }

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });
};

// Export all necessary components
module.exports = {
  makeUploader,
  makeStorage,
  imageFileFilter,
  pdfFileFilter,
  createError // Exporting createError can be useful if other modules need to create http-errors
};