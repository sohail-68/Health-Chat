const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Image storage
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/images';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'img-' + unique + path.extname(file.originalname));
  }
});

// Audio storage
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/audio';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + unique + '.webm');
  }
});

// ✅ NEW: Combined storage for voice + image
const voiceWithImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      const dir = './uploads/audio';
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } else if (file.fieldname === 'image') {
      const dir = './uploads/images';
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    }
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    if (file.fieldname === 'audio') {
      cb(null, 'audio-' + unique + '.webm');
    } else if (file.fieldname === 'image') {
      cb(null, 'img-' + unique + path.extname(file.originalname));
    }
  }
});

// Upload single image
const uploadImage = multer({ 
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

// Upload single audio
const uploadAudio = multer({ 
  storage: audioStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ✅ NEW: Upload voice + image together
const uploadVoiceWithImage = multer({
  storage: voiceWithImageStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB per file
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      // Audio files allowed
      const allowed = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed'), false);
      }
    } else if (file.fieldname === 'image') {
      // Image files allowed
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only images allowed'), false);
      }
    }
  }
});

module.exports = { 
  uploadImage, 
  uploadAudio, 
  uploadVoiceWithImage  // ✅ Export new middleware
};