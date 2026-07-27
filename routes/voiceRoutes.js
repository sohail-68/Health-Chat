const express = require('express');
const { processVoice, processVoiceWithImage, textToSpeech } = require('../controllers/voiceController');
const auth = require('../middleware/auth');
const { uploadAudio, uploadVoiceWithImage } = require('../middleware/upload');

const router = express.Router();

// ✅ Apply authentication to all routes
router.use(auth);

// ✅ Route 1: Voice only
router.post('/process', uploadAudio.single('audio'), processVoice);

// ✅ Route 2: Voice + Image together
router.post('/process-with-image', uploadVoiceWithImage.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), processVoiceWithImage);

// ✅ Route 3: Text to Speech
router.post('/text-to-speech', textToSpeech);

module.exports = router;