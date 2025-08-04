import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../actions/authAction';
import { toast } from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import logo from '../../assets/logo.jpg';

const floatingVariants = {
  animate: { 
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { loading } = useSelector(state => state.auth);
  const [lockedOut, setLockedOut] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('All fields are required');
      return;
    }

    try {
      console.log('Attempting login with:', { email: formData.email }); // Debug log
      
      const result = await dispatch(login(formData));
      
      console.log('Login result:', result); // Debug log
      
      // Check if result exists and has the expected structure
      if (result && result.success) {
        toast.success("Login Successful");
        
        if (result.role === 'admin') {
          navigate(result.profileUpdated ? '/admin-dashboard' : '/complete-admin-profile');
        } else if (result.role === 'parent') {
          navigate('/parent-dashboard');
        } else {
          // Handle other roles or default navigation
          toast.error('Unknown user role');
          console.log('Unknown role:', result.role);
        }
      } else {
        // Handle case where login didn't return success
        const errorMsg = result?.message || result?.msg || 'Login failed - no success response';
        toast.error(errorMsg);
        console.log('Login failed:', result);
      }
       
    } catch (err) {
      console.error('Login error:', err); // Debug log
      
      // More robust error handling
      let errorMsg = 'Login failed';
      
      if (err.response?.data?.msg) {
        errorMsg = err.response.data.msg;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }

      if (errorMsg.toLowerCase().includes("account is locked") || 
          errorMsg.toLowerCase().includes("too many") ||
          err.response?.status === 423) {
        setLockedOut(true);
        toast.error("Your account has been locked. Try again later or contact the school admin.");
        return;
      }

      toast.error(errorMsg);
    }
  };

  return (
    <div className="relative flex justify-center items-center w-full">
      {/* Floating Bubbles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-10 h-10 rounded-full bg-primary opacity-20 blur-xl"
          style={{
            top: `${Math.random() * 80}%`,
            left: `${Math.random() * 80}%`
          }}
          variants={floatingVariants}
          animate="animate"
        />
      ))}

      {/* Lockout Message */}
      {lockedOut && (
        <div className=" top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative z-20 max-w-md">
          Your account is locked due to too many failed login attempts. Please try again later or contact school admin.
        </div>
      )}

      {/* Glass Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ rotateX: 5, rotateY: 5, scale: 1.02 }}
        className="bg-white/30 backdrop-blur-md p-8 rounded-2xl shadow-neuro-light w-full max-w-md relative z-10 flex flex-col items-center"
      >
        {/* Floating logo on top */}
        <motion.img 
          src={logo}
          alt="School Logo"
          className="w-20 h-20 mb-4 rounded-full border-4 border-primary shadow-neuro-light"
          variants={floatingVariants}
          animate="animate"
        />

        <h2 className="text-3xl font-heading text-kaitoke mb-6 flex items-center gap-2">
          <Sparkles className="text-accent" /> Login to Your Account
        </h2>

        <form onSubmit={onSubmit} className="space-y-6 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              className="mt-1 block w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:border-primary focus:ring-primary bg-white/60 backdrop-blur"
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={onChange}
              minLength={6}
              className="mt-1 block w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:border-primary focus:ring-primary bg-white/60 backdrop-blur"
              required
            />
            <span 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-10 cursor-pointer text-gray-500 hover:text-primary"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
          </div>

          <button 
            type="submit" 
            disabled={loading || lockedOut}
            className="w-full bg-primary text-white py-3 rounded-xl hover:bg-blue-700 transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <FaSpinner className="animate-spin" /> : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/register" className="text-sm text-white hover:underline">Create new account</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;