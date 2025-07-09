import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../actions/authAction';
import { toast } from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import logo from '../../assets/logo.jpg'; // <-- import your logo

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
      const result = await dispatch(login(formData));
      if (result?.success) {
        if (result.role === 'admin') {
          navigate(result.profileUpdated ? '/admin-page' : '/complete-admin-profile');
        } else if (result.role === 'parent') {
          navigate('/parent-page');
        }
      }
    } catch (err) {
      console.error("Login error:", err);
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
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl hover:bg-blue-700 transition-all flex justify-center items-center"
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
