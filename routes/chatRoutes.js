const express = require('express');
const {
  getSessions,
  getMessages,
  deleteSession
} = require('../controllers/chatController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/sessions', getSessions);
router.get('/messages/:sessionId', getMessages);
router.delete('/session/:sessionId', deleteSession);

module.exports = router;