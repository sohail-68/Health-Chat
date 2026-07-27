const mongoose = require('mongoose');

// ✅ Sub-schema for images
const imageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },  // base64 or Cloudinary/S3 URL
  size: { type: Number },
  mimeType: { type: String }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  session: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ChatSession', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['text', 'image', 'voice'], 
    default: 'text' 
  },
  content: { 
    type: String, 
    default: '' 
  },
  
  // ✅ For multiple images
  images: {
    type: [imageSchema],
    default: []
  },
  
  // ✅ For single image (legacy)
  imageUrl: { 
    type: String 
  },
  
  audioUrl: { 
    type: String 
  },
  
  sender: { 
    type: String, 
    enum: ['user', 'ai'], 
    required: true 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Message', messageSchema);