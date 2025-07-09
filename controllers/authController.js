const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer'); 
const config = require('../config/default.json');
const { validationResult } =require('express-validator');
const sendEmail = require('../utils/sendEmail')


//@route GET api/auth
// desc Get logged in user
//@acces priavte
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

//@route Post api/auth
// desc Auth user & get token
// //@access Priavte
exports.AuthUserToken = async (req, res) => {

    const errors = validationResult(req);    
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()});
    }
    const { email, password } = req.body;    
    try{
        let user = await User.findOne({ email });
        if (!user || !user.isVerified) {
             return res.status(400).json({ msg: 'Invalid credentials or email not verified ' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({msg: 'Invalid Credentials'})
        }
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                profileUpdated: user.profileUpdated
                
            }
        }
        jwt.sign(payload, config.jwtSecret, {
            expiresIn: '1d'
        },
        (err, token) => {
            if(err) throw err;
            res.json({ token, role: user.role, userID: user.id, profileUpdated: user.profileUpdated})
        }
    )
    }catch(err){
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error'})

    }
}

// Register a user
// access private

exports.registerUser = async (req, res) => {
     const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()});
    }
    const { email, password } = req.body; 
    try{
        let user = await User.findOne({ email });
        if(user){
            return res.status(400).json({ msg: 'User already exists'});
        }
        user = new User({ email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password,salt);
        await user.save();

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
            
        }
        jwt.sign(payload,config.jwtSecret, {
            expiresIn: '1d'
        }, (err, token) =>{
            if(err) throw err;
            res.json({token, role: user.role, userID: user.id })
        }
    )


    }catch(err){
        console.error(err.message)
        res.status(500).send('Server Error');

    }
};

//verify email
exports.verifyEmail = async (req, res) => {
    try {
        const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()});
    }
    const generateToken = async () => {
        const verifyToken = crypto.randomBytes(3).toString('hex').toUpperCase();
        const hashedToken = crypto
        .createHash('sha256')
        .update(verifyToken)
        .digest('hex')

        return { verifyToken, hashedToken};
    }
    
    

    const { email } = req.body;
    const user = await User.findOne({ email })
    
    if(!user){
        await new Promise(resolve => setTimeout(resolve,1000));
        return res.json({ msg: 'If a user with this email exits, a verification code will be sent'})
    }
    const { verifyToken, hashedToken } = await generateToken();
    user.verifyToken = hashedToken;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();
    

    
      const   html = `
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
        
    }  catch (err) {
    console.error(" Email verification error:", err);
    return res.status(500).json({ error: "Something went wrong", details: err.message });
  }

};

//email confirmation 
exports.confirmEmailVerification = async (req, res) => {
    try{
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
    }catch(err){
        console.error( err.message)
        res.status(500).json({ error: 'An error occurred while verifying your email'});
    }

}


//forgot Password 
exports.forgotPassword = async (req, res) => {
    try{
        const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()});
    }

    const generateResetToken = async () => {
        const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase();
        const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

        return { resetToken, hashedToken};
    }

   


    const { email } = req.body;
    const user = await User.findOne({ email })
    
    if(!user){
        await new Promise(resolve => setTimeout(resolve,1000));
        return res.json({ msg: 'If a user with this email exits, a verification code will be sent'})
    }
    const { resetToken, hashedToken } = await generateResetToken();
    user.resetToken = hashedToken;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();
    
    
    await sendEmail({
        from: config.EMAIL_FROM,
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
        message: 'Verification code sent successfully',
        email: user.email,
    })

    }catch(err){
        console.error(err.message)
        res.status(500).json({ Error : 'An error occurred while processing your request'})

    }

}

// reset password
exports.ResetPassword = async (req, res) => {
    try{
        const { email, token, newPassword} = req.body;
        if(!email || !token || !newPassword){
            return res.status(400).json({ error: 'All fields are required'})
        }

        const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

        const user = await User.findOne({
            email: email,
            resetToken: hashedToken, 
            resetTokenExpiry: { $gt: Date.now()}
        });

        if(!user){
            return res.status(400).json({ error: 'Invalid or expired verification code'});
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




    }catch(err){
        console.error('Reset password error' ,err);
        res.status(500).json({ error: 'An error occurred while resetting the password!'});

    }

}

