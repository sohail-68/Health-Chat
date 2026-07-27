const express = require('express');
const { analyzeReport, getReports } = require('../controllers/reportController');
const auth = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

const router = express.Router();

router.use(auth);

router.post('/analyze', uploadImage.single('image'), analyzeReport);
router.get('/', getReports);

module.exports = router;