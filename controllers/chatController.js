const ChatSession = require('../models/ChatSession');
const Message = require('../models/Message');
const Patient = require('../models/Patient');
const aiService = require('../services/geminiService')

// exports.processMessage = async (userId, data) => {
//   const { sessionId, type, content, imageBase64 } = data;
 
  
//   // Get or create session
//   let session;
  
//   if (sessionId) {
//     console.log('🔍 Looking for existing session:', sessionId);
//     session = await ChatSession.findOne({ _id: sessionId, user: userId });
//     console.log('Found session:', session ? session._id : 'NO');
//   }
  
//   if (!session) {
//     console.log('✨ Creating new session for user:', userId);
//     session = new ChatSession({ user: userId, title: 'New Chat' });
//     await session.save();
//     console.log('✅ New session created:', session._id);
//   }
  
//   // Get patient info for context
//   const patient = await Patient.findOne({ user: userId });
//   console.log('👤 Patient found:', patient ? 'Yes' : 'No');
  
//   // Get previous messages for context
//   const previousMessages = await Message.find({ session: session._id })
//     .sort({ createdAt: -1 })
//     .limit(10);
//   console.log('📚 Previous messages count:', previousMessages.length);
  
//   const chatHistory = previousMessages.reverse().map(msg => ({
//     sender: msg.sender,
//     content: msg.type === 'image' ? '[Image]' : msg.content
//   }));
  
//   let aiResponse = '';
//   let userMessageContent = '';
  
//   // Handle different message types
//   if (type === 'text') {
//     console.log('💬 Processing TEXT message');
//     userMessageContent = content;
    
//     // Save user message
//     await Message.create({
//       session: session._id,
//       user: userId,
//       type: 'text',
//       content: content,
//       sender: 'user'
//     });
    
//     // Get AI response
//     console.log('🤖 Calling Gemini API...');
//     aiResponse = await aiService.getHealthResponse(content, patient, chatHistory);
    
//   } else if (type === 'image') {
//     console.log('🖼️ Processing IMAGE message');
//     userMessageContent = '[Uploaded an image]';
    
//     await Message.create({
//       session: session._id,
//       user: userId,
//       type: 'image',
//       content: content || 'Medical report',
//       imageUrl: content,
//       sender: 'user'
//     });
//     console.log('✅ Image message saved');
    
//     console.log('🤖 Calling Gemini Vision API...');
//     aiResponse = await aiService.analyzeReportImage(imageBase64, content || null);
//     console.log('🤖 AI Vision Response received:', aiResponse?.substring(0, 100));
//   }
  
//   // Save AI response
//   const aiMessage = await Message.create({
//     session: session._id,
//     user: userId,
//     type: 'text',
//     content: aiResponse,
//     sender: 'ai'
//   });
//   console.log('✅ AI response saved to DB:', aiMessage._id);
  
//   // Update session title if first message
//   if (previousMessages.length === 0) {
//     session.title = userMessageContent.substring(0, 50);
//     await session.save();
//     console.log('📝 Session title updated:', session.title);
//   }
  
//   session.updatedAt = new Date();
//   await session.save();
  
//   const result = {
//     sessionId: session._id,
//     messageId: aiMessage._id,
//     content: aiResponse,
//     timestamp: aiMessage.createdAt
//   };
  
//   console.log('📤 RETURNING RESULT:', {
//     sessionId: result.sessionId,
//     messageId: result.messageId,
//     contentLength: result.content?.length,
//     timestamp: result.timestamp
//   });
//   console.log('=========================================\n');
  
//   return result;
// };



exports.processMessage = async (userId, data) => {
  const { sessionId, text = "", images = [] } = data;

  // Get or create session
  let session;

  if (sessionId) {
    session = await ChatSession.findOne({
      _id: sessionId,
      user: userId,
    });
    console.log("1",session);
    
  }

  if (!session) {
    session = new ChatSession({
      user: userId,
      title: "New Chat",
    });
    console.log("2",session);

    await session.save();
  }

  // Patient Context
  const patient = await Patient.findOne({ user: userId });

  // Previous Messages
  const previousMessages = await Message.find({
    session: session._id,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  const chatHistory = previousMessages.reverse().map((msg) => ({
    sender: msg.sender,
    content: msg.content,
  }));

  const hasText = text.trim().length > 0;
  const hasImages = images.length > 0;

  let aiResponse = "";

  // =============================
  // Save User Message
  // =============================

  await Message.create({
    session: session._id,
    user: userId,
    sender: "user",
    type: hasImages ? "image" : "text",
    content: text,
    images: images.map((img) => ({
      name: img.name,
      url: img.base64,
    })),
  });

  // =============================
  // AI Response
  // =============================

  if (hasImages && hasText) {
    console.log(`📷 + 💬 ${images.length} Image(s) with Prompt`);

    if (images.length === 1) {
      // ✅ Single image - normal flow
      aiResponse = await aiService.analyzeReportImage(
        images[0].base64,
        text
      );
    } else {
      // ✅ Multiple images - combine them
      aiResponse = await aiService.analyzeMultipleReportImages(
        images.map(img => img.base64),
        text
      );
    }

  } else if (hasImages) {
    console.log(`📷 ${images.length} Image(s) Only`);

    if (images.length === 1) {
      aiResponse = await aiService.analyzeReportImage(
        images[0].base64,
        null
      );
    } else {
      aiResponse = await aiService.analyzeMultipleReportImages(
        images.map(img => img.base64),
        null
      );
    }

  } else if (hasText) {
    console.log("💬 Text Only");
    aiResponse = await aiService.getHealthResponse(
      text,
      patient,
      chatHistory
    );
  } else {
    throw new Error("Message cannot be empty.");
  }


  const aiMessage = await Message.create({
    session: session._id,
    user: userId,
    sender: "ai",
    type: "text",
    content: aiResponse,
  });

 
  if (previousMessages.length === 0) {
    if (hasText) {
      session.title = text.substring(0, 50);
    } else {
      session.title = `Medical Report (${images.length} images)`;
    }
  }

  session.updatedAt = new Date();
  await session.save();

  return {
    sessionId: session._id,
    messageId: aiMessage._id,
    content: aiResponse,
    timestamp: aiMessage.createdAt,
  };
};


exports.getSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.userId })
      .sort({ updatedAt: -1 });
    
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get messages for a session
exports.getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ChatSession.findOne({ _id: sessionId, user: req.userId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    
    const messages = await Message.find({ session: sessionId })
      .sort({ createdAt: 1 });
    
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete session
exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    await Message.deleteMany({ session: sessionId });
    await ChatSession.findOneAndDelete({ _id: sessionId, user: req.userId });
    
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};