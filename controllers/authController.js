const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Patient = require('../models/Patient');
const emailService = require('../services/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============ EMAIL REGISTRATION WITH OTP ============
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists. Please login or use Google login.'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with OTP
    const user = await User.create({
      name,
      email,
      password,
      emailOTP: otp,
      emailOTPExpiry: otpExpiry,
      isEmailVerified: false
    });

    // Create patient record
    await Patient.create({
      user: user._id,
      name,
    });

    // Send OTP via email
    // await emailService.sendOTPEmail(email, otp, name);

    res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      userId: user._id,
      email: email
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============ VERIFY OTP ============
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified. You can now login.'
      });
    }

    // Check OTP expiry
    if (user.emailOTPExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check OTP match
    if (user.emailOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpiry = undefined;
    await user.save();

    // Generate JWT token for auto-login after verification
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: true
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============ RESEND OTP ============
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified. You can login.'
      });
    }

    // Generate new OTP
    const newOTP = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.emailOTP = newOTP;
    user.emailOTPExpiry = otpExpiry;
    await user.save();

    // Send new OTP
    await emailService.sendOTPEmail(email, newOTP, user.name);

    res.status(200).json({
      success: true,
      message: 'New OTP sent to your email'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============ LOGIN WITH EMAIL/PASSWORD ============
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email });

    if (!user || !await user.comparePassword(password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first. Check your inbox for OTP or request a new one.'
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============ GOOGLE LOGIN ============
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (!user) {
      // Create new user with Google
      user = await User.create({
        name: name,
        email: email,
        googleId: googleId,
        isEmailVerified: true // Google emails are already verified
      });

      // Create patient record
      await Patient.create({
        user: user._id,
        name: name
      });
    } else if (!user.googleId) {
      // Link Google account to existing email user
      user.googleId = googleId;
      if (!user.isEmailVerified) {
        user.isEmailVerified = true; // Auto-verify if Google login
      }
      await user.save();
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Google login successful',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        isGoogleLogin: !!user.googleId
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed. Please try again.'
    });
  }
};

// ============ GET PROFILE ============
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -emailOTP -emailOTPExpiry');
    const patient = await Patient.findOne({ user: req.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user,
      patient
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============ CHECK EMAIL VERIFICATION STATUS ============
exports.checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      isEmailVerified: user.isEmailVerified,
      hasGoogleLogin: !!user.googleId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
