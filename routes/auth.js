const express  = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { check, body } =require('express-validator');
const secretKey = require('../middleware/checkSecretKey')
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, 
  message: {
    msg: 'Too many login attempts. Please try again after 15 minutes.'
  },
});

router.get('/',auth, authController.getLoginUser);
router.post('/login', [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists()
],loginLimiter, authController.AuthUserToken);

router.post('/register',secretKey,[
    check('email', 'Please enter your email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({min: 8}),
    
    
], 
authController.registerUser);

router.post('/forgot-password', secretKey,
    [
      body('email').isEmail().withMessage(('Invalid Email Format'))  
    ],
    authController.forgotPassword

)


router.post('/reset-password', 
    [
      check('password', 'Please enter a password with 8 or more characters').isLength({min : 8})  
    ],
    authController.ResetPassword

)


router.post('/verify-email', 
    [check("email", "Please include a valid email").isEmail(),],
    authController.verifyEmail

)


router.post('/confirm-email-verification', 
    [
         check('email', 'Please enter a valid email').isEmail(),
  check('code', 'Verification code is required').notEmpty()
    ],
    authController.confirmEmailVerification

)



module.exports = router;

