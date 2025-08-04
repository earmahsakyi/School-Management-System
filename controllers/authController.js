const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail')

//@route GET api/auth
// desc Get logged in user
//@access private
exports.getLoginUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

//@route POST api/auth/login
// desc Auth user & get token
//@access Public
const MAX_ATTEMPTS = 3;

const LOCK_DURATIONS = {
  1: 30 * 60 * 1000,      // 30 minutes
  2: 60 * 60 * 1000,      // 1 hour
};

exports.AuthUserToken = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      msg: 'Invalid input',
      errors: errors.array() 
    });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid credentials' 
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({ 
        success: false,
        msg: 'Email not verified. Please verify your email first.' 
      });
    }

    // Check manual lock
    if (user.lockedManually === true) {
      return res.status(423).json({ 
        success: false,
        msg: 'Account locked by admin. Contact school office to unlock.' 
      });
    }

    // Check timed lock - be more explicit about the check
    if (user.lockUntil && typeof user.lockUntil === 'object' && user.lockUntil > new Date()) {
      const wait = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({ 
        success: false,
        msg: `Account locked. Try again in ${wait} minute(s).` 
      });
    }

    // Clear expired lock
    if (user.lockUntil && user.lockUntil <= new Date()) {
      user.lockUntil = null;
      user.loginAttempts = 0;
      user.lockLevel = 0;
      await user.save();
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= MAX_ATTEMPTS) {
        user.lockLevel += 1;

        if (user.lockLevel >= 3) {
          user.lockedManually = true;
          const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    <h2 style="color: #D32F2F;">Account Locked</h2>
    <p>Hello,</p>
    <p>We noticed multiple unsuccessful login attempts on your account associated with this email address.</p>
    <p><strong>As a result, your account has been temporarily locked for security reasons.</strong></p>

    <p>If you believe this was a mistake or you require urgent access, please contact the school administration to have your account reviewed and unlocked.</p>

    <div style="background-color: #fce4ec; padding: 10px; border-left: 4px solid #d50000; margin: 20px 0;">
      <strong>Status:</strong> Locked after too many failed attempts<br>
      <strong>Next step:</strong> Contact admin or wait if this is your 1st or 2nd lock.
    </div>

    <p>If this activity was not initiated by you, we recommend resetting your password after regaining access.</p>

    <p style="margin-top: 30px;">Thank you,<br><strong>School Management System Team</strong></p>
  </div>
`;
          // Send mail to locked account
          try {
            await sendEmail({
              to: email,
              subject: 'Account Locked',
              html,
            });
          } catch (emailErr) {
            console.error('Failed to send lock email:', emailErr);
          }

        } else {
          user.lockUntil = new Date(Date.now() + LOCK_DURATIONS[user.lockLevel]);
        }

        await user.save();
        return res.status(400).json({ 
          success: false,
          msg: 'Too many failed attempts. Account is temporarily locked.' 
        });
      }

      await user.save();
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid Credentials' 
      });
    }

    // Successful login - reset security fields
    user.loginAttempts = 0;
    user.lockLevel = 0;
    user.lockUntil = null;
    user.lockedManually = false;
    await user.save();

    // Generate token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(payload, process.env.jwtSecret, { expiresIn: '1d' }, (err, token) => {
      if (err) {
        console.error('JWT Error:', err);
        return res.status(500).json({ 
          success: false,
          msg: 'Server error generating token' 
        });
      }
      
      // Return success response with all needed data
      res.json({ 
        success: true,
        token,
        role: user.role,
        userId: user._id,
        email: user.email,
        profileUpdated: user.profileUpdated || false,
        msg: 'Login successful'
      });
    });
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server error' 
    });
  }
};

// Register a user
// access private
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { email, password } = req.body;
  
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    
    user = new User({ email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    }
    
    jwt.sign(payload, process.env.jwtSecret, {
      expiresIn: '1d'
    }, (err, token) => {
      if (err) throw err;
      res.json({ token, role: user.role, userID: user.id })
    });

  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error');
  }
};

//verify email
exports.verifyEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const generateToken = async () => {
      const verifyToken = crypto.randomBytes(3).toString('hex').toUpperCase();
      const hashedToken = crypto
        .createHash('sha256')
        .update(verifyToken)
        .digest('hex')

      return { verifyToken, hashedToken };
    }

    const { email } = req.body;
    const user = await User.findOne({ email })

    if (!user) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.json({ msg: 'If a user with this email exits, a verification code will be sent' })
    }
    
    const { verifyToken, hashedToken } = await generateToken();
    user.verifyToken = hashedToken;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    const html = `
         <h2>Email Verification code</h2>
            <p>Your verification code is : </p>
            <h1 style="font-size: 24px; letter-spacing: 2px; color: #007AFF">${verifyToken}</h1>
            <p>This Code will expire in 1 hour.</p>
            <p>If you didn't request this code, please ignore this email.</p>
        `
    await sendEmail({
      to: email,
      subject: 'Your Verification Code',
      html,
    });
    
    res.json({
      message: 'Verification code sent successfully',
      email: user.email
    })

  } catch (err) {
    console.error(" Email verification error:", err);
    return res.status(500).json({ error: "Something went wrong", details: err.message });
  }
};

//email confirmation 
exports.confirmEmailVerification = async (req, res) => {
  try {
    const { email, code } = req.body;
    const hashedToken = crypto.createHash('sha256').update(code).digest('hex');

    const user = await User.findOne({
      email,
      verifyToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ msg: 'Invalid or expired code' });

    user.verifyToken = undefined;
    user.resetTokenExpiry = undefined;
    user.isVerified = true;
    await user.save();

    return res.json({ success: true, message: 'Email successfully verified' });
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ error: 'An error occurred while verifying your email' });
  }
}

//forgot Password 
exports.forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const generateResetToken = async () => {
      const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase();
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

      return { resetToken, hashedToken };
    }

    const { email } = req.body;
    const user = await User.findOne({ email })

    if (!user) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.json({ msg: 'If a user with this email exits, a verification code will be sent' })
    }
    
    const { resetToken, hashedToken } = await generateResetToken();
    user.resetToken = hashedToken;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    await sendEmail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Verification Code',
      html: `
         <h2>Password Reset Verification Code</h2>
            <p>Your verification code is : </p>
            <h1 style="font-size: 24px; letter-spacing: 2px; color: #007AFF">${resetToken}</h1>
            <p>This Code will expire in 1 hour.</p>
            <p>If you didn't request this code, please ignore this email.</p>
        `
    });
    
    res.json({
      success: true,
      message: 'Verification code sent successfully',
      email: user.email,
    })

  } catch (err) {
    console.error(err.message)
    res.status(500).json({ Error: 'An error occurred while processing your request' })
  }
}

// reset password
exports.ResetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      email: email,
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();

    res.json({
      success: true,
      message: 'Password reset Successful'
    });

  } catch (err) {
    console.error('Reset password error', err);
    res.status(500).json({ error: 'An error occurred while resetting the password!' });
  }
}