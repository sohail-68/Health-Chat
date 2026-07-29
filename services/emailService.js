const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOTPEmail = async (email, otp, name) => {
  try {
    const info = await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for registering! Please use the following OTP to verify your email address:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #4CAF50; background: #f5f5f5; padding: 15px; border-radius: 8px; display: inline-block;">
              ${otp}
            </div>
          </div>
          
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
          
          <hr style="margin: 20px 0;" />
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    });
    
    console.log('OTP email sent:', info.messageId);
    return info;
    
  } catch (error) {
 console.error("SMTP ERROR:", error); // Original error print karo
    throw error; // New Error mat throw karo

  }
};
