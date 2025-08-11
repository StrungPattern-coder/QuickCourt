import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SEO from '@/components/SEO';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      await login(email, password);
      
      // Role-based redirection
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        switch (user.role) {
          case 'ADMIN':
            navigate('/admin/dashboard', { replace: true });
            break;
          case 'OWNER':
            navigate('/owner/dashboard', { replace: true });
            break;
          default:
            navigate('/venues', { replace: true });
        }
      } else {
        navigate(from, { replace: true });
      }
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Implement Google OAuth flow here
    console.log('Google login triggered');
  };

  const handleOTPLogin = () => {
    navigate('/otp-login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SEO title="Login - QuickCourt" description="Sign in to your QuickCourt account" path="/login" />
      
      {/* Left Column - Background Image (Desktop Only) */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/80 to-[#27AE60]/90" />
        <div className="relative z-10 flex items-center justify-center w-full p-12">
          <div className="text-center text-white">
            <motion.h1 
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Play. Book. Repeat.
            </motion.h1>
            <motion.p 
              className="text-xl opacity-90"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Discover and book the best sports venues in your city
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Back Button - Mobile */}
          <div className="mb-4 sm:mb-6 lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="mb-3 sm:mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          {/* Login Card */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              {/* Logo */}
              <motion.div 
                className="mx-auto h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center mb-4 sm:mb-6 shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <span className="text-white font-bold text-xl sm:text-2xl">QC</span>
              </motion.div>

              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                Welcome Back to QuickCourt
              </h1>
              <p className="text-gray-500 text-sm sm:text-base">
                Book your favorite sports venue in seconds.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 sm:h-12 border-gray-200 focus:border-[#2ECC71] focus:ring-[#2ECC71] transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-12 h-12 border-gray-200 focus:border-[#2ECC71] focus:ring-[#2ECC71] transition-colors"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-gray-300"
                  />
                  <Label 
                    htmlFor="remember" 
                    className="text-sm text-gray-600 font-normal cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#2ECC71] hover:text-[#27AE60] font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Login Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-[#2ECC71] hover:bg-[#27AE60] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Login'}
                </Button>
              </motion.div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Google Login Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-semibold rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
              </motion.div>

              {/* OTP Login Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleOTPLogin}
                  className="w-full h-12 text-[#2ECC71] hover:text-[#27AE60] hover:bg-green-50 font-semibold rounded-lg transition-all duration-200"
                >
                  Login with OTP
                </Button>
              </motion.div>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="text-[#2ECC71] hover:text-[#27AE60] font-semibold transition-colors"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Back Button - Desktop */}
          <div className="hidden lg:block mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
