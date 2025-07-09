import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaSpinner, FaEnvelope, FaCheck, FaShieldAlt, FaRedo } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { confirmEmail, clearAuthMessage, verifyEmail } from '../../actions/authAction';

const VerifyEmail = () => {
  const [token, setToken] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, message } = useSelector(state => state.auth);
   const email = localStorage.getItem('email');  

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      toast.error("No Email found for verification")
      navigate('/register');
    }
  }, [email]);

  // Show error messages
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
    if (message) {
      toast.success(message);
      dispatch(clearAuthMessage()); 
    }
  }, [error, message, dispatch]);

 const onSubmit = async (e) => {
     e.preventDefault();
     
     if (!token.trim()) {
      toast.error("Enter the code for verification")
       return;
     }
 
     try {
       const result = await dispatch(confirmEmail(token)); // Pass token directly
       
       if (result.success) {
           setTimeout(() => navigate('/'), 1500);
           localStorage.removeItem('email')
      }
     } catch (err) {
       console.error("Verification failed:", err);
     }
   };


  const handleResendCode = async () => {
    await dispatch(verifyEmail(email))
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iIzlmYTZiYSIgZmlsbC1vcGFjaXR5PSIwLjAzIj4KPHBhdGggZD0iTTM2IDM0djEwaDRWMzR6bTAtMTBWMTRoNHYxMHptMC0xMFYwaDR2MTR6bTAtMTBWMGg0djEweiIvPgo8L2c+CjwvZz4KPC9zdmc+')] opacity-20"></div>
        
        {/* Floating Orbs */}
        <motion.div 
          className="absolute top-1/3 left-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.3, 1, 1.3],
            rotate: [360, 180, 0],
            opacity: [0.6, 0.3, 0.6]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Back Button */}
          <motion.button 
            onClick={() => navigate('/register')}
            className="flex items-center mb-6 text-white/80 hover:text-white transition-colors group bg-black rounded-lg"
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft className="mr-2 group-hover:animate-pulse" /> 
            Back to Register
          </motion.button>

          {/* Card */}
          <motion.div 
            className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden"
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(20px)" }}
            transition={{ duration: 1 }}
          >
            {/* Card Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl"></div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <motion.div 
                className="text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div 
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <FaEnvelope className="text-white text-2xl" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">Verify Your Email</h2>
                {email && (
                  <motion.p 
                    className="text-white/70 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    A verification code has been sent to{' '}
                    <span className="font-semibold text-blue-300">{email}</span>
                  </motion.p>
                )}
              </motion.div>

              {/* Verification Code Input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <label className="block text-sm font-semibold mb-2 text-white/90">
                  Verification Code
                </label>
                <div className="relative group">
                  <FaShieldAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="text" 
                    id="verification"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 text-center text-lg tracking-widest"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                  {token.length === 6 && (
                    <motion.div 
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <FaCheck className="text-green-400" />
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Verify Button */}
              <motion.button
                onClick={onSubmit}
                disabled={loading || !token.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <motion.div 
                    className="flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <FaSpinner className="animate-spin mr-2" />
                    Verifying...
                  </motion.div>
                ) : (
                  <motion.div 
                    className="flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <FaCheck className="mr-2" />
                    Verify Email
                  </motion.div>
                )}
              </motion.button>

              {/* Resend Code Button */}
              <motion.button
                onClick={handleResendCode}
                disabled={loading}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ backdropFilter: "blur(20px)" }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div 
                  className="flex items-center justify-center"
                  whileHover={{ x: [0, -2, 2, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  <FaRedo className="mr-2 text-sm" />
                  Resend Code
                </motion.div>
              </motion.button>

              {/* Use Different Email */}
              <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <p className="text-white/70 text-sm mb-2">
                  Didn't receive the code or want to use a different email?
                </p>
                <motion.button
                  onClick={() => {
                    // localStorage.removeItem('email');
                    navigate('/register');
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Use Different Email
                </motion.button>
              </motion.div>

              {/* Help Text */}
              <motion.div 
                className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <p className="text-white/80 text-xs text-center">
                  💡 Check your spam folder if you don't see the email. 
                  The code expires in 10 minutes.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyEmail;