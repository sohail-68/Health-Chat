const fs = require('fs');
const ChatSession = require('../models/ChatSession');
const Message = require('../models/Message');
const Patient = require('../models/Patient');
const speechService = require('../services/speechService');
const aiService = require('../services/geminiService');

// ============================================================
// ✅ ROUTE 1: VOICE ONLY
// ============================================================
exports.processVoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please upload audio' 
      });
    }

    const audioPath = req.file.path;

    // Step 1: Speech to Text
    const transcribedText = await speechService.speechToText(audioPath);
    
    if (!transcribedText) {
      return res.status(400).json({ 
        success: false, 
        message: 'Audio samajh nahi aaya. Kripya clear bolkar try karein.' 
      });
    }

    console.log('📝 User said:', transcribedText);

    // Step 2: Get or create session
    let session = await ChatSession.findOne({ user: req.userId })
      .sort({ updatedAt: -1 });
      
    if (!session) {
      session = new ChatSession({ 
        user: req.userId, 
        title: 'Voice Chat' 
      });
      await session.save();
    }

    // Step 3: Get patient info
    const patient = await Patient.findOne({ user: req.userId });

    // Step 4: Get chat history
    const chatHistory = await Message.find({ session: session._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Step 5: Get AI response
    const aiTextResponse = await aiService.getHealthResponse(
      transcribedText, 
      patient, 
      chatHistory.reverse()
    );

    // Step 6: Save user voice message
    await Message.create({
      session: session._id,
      user: req.userId,
      type: 'voice',
      content: transcribedText,
      audioUrl: `/uploads/audio/${req.file.filename}`,
      sender: 'user'
    });

    // Step 7: Save AI response
    await Message.create({
      session: session._id,
      user: req.userId,
      type: 'text',
      content: aiTextResponse,
      sender: 'ai'
    });

    // Step 8: Update session
    session.updatedAt = new Date();
    if (session.title === 'Voice Chat' && transcribedText) {
      session.title = transcribedText.substring(0, 50);
    }
    await session.save();

    // Step 9: Convert AI response to speech
    const audioResponse = await speechService.textToSpeech(aiTextResponse, 'hi-IN');

    // Step 10: Clean up audio
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }

    res.json({
      success: true,
      data: {
        textQuery: transcribedText,
        textResponse: aiTextResponse,
        audioResponseUrl: audioResponse.audioUrl,
        sessionId: session._id
      }
    });

  } catch (error) {
    console.error('❌ Voice processing error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ============================================================
// ✅ ROUTE 2: VOICE + IMAGE
// ============================================================
exports.processVoiceWithImage = async (req, res) => {
  try {
    // ✅ Check audio file
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please upload audio' 
      });
    }

    const audioPath = req.file.path;
    const imageFile = req.files?.image?.[0] || null;
    
    console.log('🎤 Voice + Image Processing:');
    console.log('📊 Audio:', req.file.originalname);
    console.log('🖼️ Image:', imageFile ? imageFile.originalname : 'No image');

    // Step 1: Speech to Text
    const transcribedText = await speechService.speechToText(audioPath);
    
    if (!transcribedText) {
      return res.status(400).json({ 
        success: false, 
        message: 'Audio samajh nahi aaya. Kripya clear bolkar try karein.' 
      });
    }

    console.log('📝 User said:', transcribedText);

    // Step 2: Get or create session
    let session = await ChatSession.findOne({ user: req.userId })
      .sort({ updatedAt: -1 });
      
    if (!session) {
      session = new ChatSession({ 
        user: req.userId, 
        title: 'Voice Chat' 
      });
      await session.save();
    }

    // Step 3: Get patient info
    const patient = await Patient.findOne({ user: req.userId });

    // Step 4: Get AI response
    let aiTextResponse = '';
    
    if (imageFile) {
      // ✅ Voice + Image
      console.log('🖼️ Analyzing image with voice question...');
      
      const imageBase64 = fs.readFileSync(imageFile.path, { encoding: 'base64' });
      const imageDataUrl = `data:${imageFile.mimetype};base64,${imageBase64}`;
      
      aiTextResponse = await aiService.analyzeReportImage(imageDataUrl, transcribedText);
      
      // Save voice message
      await Message.create({
        session: session._id,
        user: req.userId,
        type: 'voice',
        content: transcribedText,
        audioUrl: `/uploads/audio/${req.file.filename}`,
        sender: 'user'
      });
      
      // Save image message
      await Message.create({
        session: session._id,
        user: req.userId,
        type: 'image',
        content: `Voice question: ${transcribedText}`,
        imageUrl: `/uploads/images/${imageFile.filename}`,
        sender: 'user'
      });
      
      // Clean up image
      if (fs.existsSync(imageFile.path)) {
        fs.unlinkSync(imageFile.path);
      }
      
    } else {
      // ✅ Voice only (fallback)
      console.log('🎤 Processing only voice...');
      
      const chatHistory = await Message.find({ session: session._id })
        .sort({ createdAt: -1 })
        .limit(10);
      
      aiTextResponse = await aiService.getHealthResponse(
        transcribedText, 
        patient, 
        chatHistory.reverse()
      );
      
      await Message.create({
        session: session._id,
        user: req.userId,
        type: 'voice',
        content: transcribedText,
        audioUrl: `/uploads/audio/${req.file.filename}`,
        sender: 'user'
      });
    }

    // Step 5: Save AI response
    await Message.create({
      session: session._id,
      user: req.userId,
      type: 'text',
      content: aiTextResponse,
      sender: 'ai'
    });

    // Step 6: Update session
    session.updatedAt = new Date();
    if (session.title === 'Voice Chat' && transcribedText) {
      session.title = transcribedText.substring(0, 50);
    }
    await session.save();

    // Step 7: Convert AI response to speech
    const audioResponse = await speechService.textToSpeech(aiTextResponse, 'hi-IN');

    // Step 8: Clean up audio
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }

    res.json({
      success: true,
      data: {
        textQuery: transcribedText,
        textResponse: aiTextResponse,
        audioResponseUrl: audioResponse.audioUrl,
        sessionId: session._id,
        hasImage: !!imageFile
      }
    });

  } catch (error) {
    console.error('❌ Voice + Image error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (req.files && req.files.image) {
      req.files.image.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ============================================================
// ✅ ROUTE 3: TEXT TO SPEECH
// ============================================================
exports.textToSpeech = async (req, res) => {
  try {
    const { text, language } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Text required' 
      });
    }
    
    const audio = await speechService.textToSpeech(text, language || 'hi-IN');
    
    res.json({ 
      success: true, 
      audioUrl: audio.audioUrl 
    });
    
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};