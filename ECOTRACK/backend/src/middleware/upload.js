'use strict';
const multer = require('multer');

// Use memory storage — files are streamed to Supabase Storage, not written to disk
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, or GIF image files are allowed.'), false);
  }
}

// Avatar upload: max 3 MB
const uploadAvatar = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter,
});

// Screenshot upload: max 5 MB
const uploadScreenshot = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

module.exports = { uploadAvatar, uploadScreenshot };
