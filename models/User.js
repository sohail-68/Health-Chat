const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: function() {
      // Password is required only for email registration (not Google login)
      return !this.googleId;
    }
  },

  googleId: {
    type: String,
    sparse: true,
    unique: true
  },

  isEmailVerified: {
    type: Boolean,
    default: false
  },

  // OTP fields
  emailOTP: {
    type: String
  },

  emailOTPExpiry: {
    type: Date
  },

  // Keep this for backward compatibility if needed
  emailVerificationToken: {
    type: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);