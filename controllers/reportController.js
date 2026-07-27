const Report = require('../models/Report');
const ChatSession = require('../models/ChatSession');
const Message = require('../models/Message');
const geminiService = require('../services/geminiService');

// Upload and analyze report image
exports.analyzeReport = async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image' });
    }
    
    const imageUrl = `/uploads/images/${req.file.filename}`;
    const imagePath = req.file.path;
    
    // Read image as base64
    const fs = require('fs');
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    const mimeType = `image/${req.file.filename.split('.').pop()}`;
    const fullBase64 = `data:${mimeType};base64,${imageBase64}`;
    
    // Get AI analysis
    const aiResponse = await geminiService.analyzeReportImage(fullBase64, question);
    
    // Create a chat session for this report (optional)
    let session = await ChatSession.findOne({ user: req.userId, title: 'Report Analysis' });
    if (!session) {
      session = new ChatSession({ user: req.userId, title: 'Report Analysis' });
      await session.save();
    }
    
    // Save user message with image
    await Message.create({
      session: session._id,
      user: req.userId,
      type: 'image',
      content: question || 'Please analyze this report',
      imageUrl: imageUrl,
      sender: 'user'
    });
    
    // Save AI response
    await Message.create({
      session: session._id,
      user: req.userId,
      type: 'text',
      content: aiResponse,
      sender: 'ai'
    });
    
    res.json({
      success: true,
      data: {
        imageUrl: imageUrl,
        analysis: aiResponse,
        sessionId: session._id
      }
    });
    
  } catch (error) {
    console.error('Report analysis error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all reports (images) for a user
exports.getReports = async (req, res) => {
  try {
    const messages = await Message.find({ 
      user: req.userId, 
      type: 'image',
      sender: 'user'
    }).sort({ createdAt: -1 });
    
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};