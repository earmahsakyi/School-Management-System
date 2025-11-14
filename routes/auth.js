const express  = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { check, body } =require('express-validator');
const secretKey = require('../middleware/checkSecretKey')
const { 
  authLimiter, 
  passwordResetLimiter, 
  emailVerificationLimiter 
} = require('../middleware/rateLimiter');
const getClientIp = require('../middleware/getClientIp');

router.use(getClientIp);



router.get('/',auth, authController.getLoginUser);
router.post('/login',  authLimiter, [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists()
], authController.AuthUserToken);

router.post('/register', authLimiter,secretKey,[
    check('email', 'Please enter your email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({min: 8}),
    
    
], 
authController.registerUser);

router.post('/forgot-password',passwordResetLimiter, secretKey,
    [
      body('email').isEmail().withMessage(('Invalid Email Format'))  
    ],
    authController.forgotPassword

)


router.post('/reset-password', passwordResetLimiter,
    [
      check('password', 'Please enter a password with 8 or more characters').isLength({min : 8})  
    ],
    authController.ResetPassword

)


router.post('/verify-email', emailVerificationLimiter,
    [check("email", "Please include a valid email").isEmail(),],
    authController.verifyEmail

)


router.post('/confirm-email-verification', emailVerificationLimiter,
    [
         check('email', 'Please enter a valid email').isEmail(),
  check('code', 'Verification code is required').notEmpty()
    ],
    authController.confirmEmailVerification

)



module.exports = router;

