import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaSpinner, FaArrowLeft, FaShieldAlt, FaPaperPlane, FaCheck,FaUserPlus, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-hot-toast'
import { forgotPassword } from '../../actions/authAction';

const ForgotPassword = () => {
  const [user, setUser] = useState({ 
    email: '',
    secretKey: ''
  });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const dispatch = useDispatch();  

  const navigate = useNavigate()
  const loading = useSelector(state => state.auth.loading);

  const { email, secretKey } = user;

  const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
 

  const onChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });

    switch (name) {
      case 'email':
        setErrors(prev => ({ ...prev, email: !validateEmail(value) ? 'Invalid email' : '' }));
        break;
    }
  };
 const onSubmit = async (e) => {
   e.preventDefault();
   
   // ... (keep your validation checks)
   if (email === ''|| secretKey === ''){
     toast.error("All fields are required!")
     return;
   }
 
   try {
     const result = await dispatch(forgotPassword( email,secretKey));
     if (result?.success){
        setFeedback({ 
       type: 'success', 
       message: 'Reset Code sent  successful! Please check your email.'   
     });
     setTimeout(()=> {
        navigate('/reset-password')
     },1000)
     }

     // Check for error in result (not res.error)
     if (result?.error) {
       throw new Error(result.error);
     }

     
   } catch (err) {
     setFeedback({ 
       type: 'error', 
       message: err.message || 'There was an error!' 
     });
   }
 };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iIzlmYTZiYSIgZmlsbC1vcGFjaXR5PSIwLjAzIj4KPHBhdGggZD0iTTM2IDM0djEwaDRWMzR6bTAtMTBWMTRoNHYxMHptMC0xMFYwaDR2MTR6bTAtMTBWMGg0djEweiIvPgo8L2c+CjwvZz4KPC9zdmc+')] opacity-20"></div>
        
        {/* Floating Orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
            opacity: [0.5, 0.3, 0.5]
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
            onClick={() => navigate('/')}
            className="flex items-center mb-6 text-white bg-black rounded-lg hover:text-white transition-colors group"
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft className="mr-2 group-hover:animate-pulse" /> 
            Back to Home
          </motion.button>
     {feedback.message && (
  <div className={`p-4 rounded-xl mb-4
    ${feedback.type === 'success' 
      ? 'bg-green-100 text-green-700 border border-green-300'
      : 'bg-red-100 text-red-700 border border-red-300'
    }`}>
    {feedback.message}
  </div>
)}


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
                  <FaUserPlus className="text-white text-2xl" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">VMHS Admin</h2>
                <p className="text-white/70 text-sm">Reset your Password</p>
              </motion.div>

              {/* Form */}
              <div className="space-y-6">
                {/* Email Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-semibold mb-2 text-white/90">Email Address</label>
                  <div className="relative group">
                    <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 group-focus-within:text-blue-400 transition-colors" />
                    <input 
                      type="email" 
                      name="email"
                      value={email}
                      onChange={onChange}
                      className={`w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 ${errors.email ? 'border-red-400/50' : 'border-white/20'}`}
                      placeholder="Enter your email"
                    />
                    {email && !errors.email && (
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
                  {errors.email && (
                    <motion.p 
                      className="text-red-400 text-xs mt-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </motion.div>
                {/* Secret Key Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className="block text-sm font-semibold mb-2 text-white/90">Admin Secret Key</label>
                  <div className="relative group">
                    <FaShieldAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 group-focus-within:text-blue-400 transition-colors" />
                    <input 
                      type="password"
                      name="secretKey"
                      value={secretKey}
                      onChange={onChange}
                      className={`w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 ${errors.secretKey ? 'border-red-400/50' : 'border-white/20'}`}
                      placeholder="Enter admin secret key"
                    />
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onSubmit}
                >
                  {loading ? (
                    <motion.div 
                      className="flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <FaSpinner className="animate-spin mr-2" />
                      Sending Code...
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <FaPaperPlane className="mr-2" />
                      Send Code
                    </motion.div>
                  )}
                  </motion.button>
                </div>

              {/* Footer */}
              <motion.p 
                className="mt-8 text-center text-sm text-white/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                I remember my password now{' '}
                <motion.span 
                  className="text-blue-400 hover:text-blue-300 cursor-pointer font-semibold"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate('/login')}
                >
                  Login
                </motion.span>
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;