import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Sparkles, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { apiService } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiService.login(formData);
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Đăng nhập thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/3 bg-gradient-to-br from-slate-700 via-slate-600 to-gray-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center items-center h-full p-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Sparkles className="w-14 h-14 mx-auto mb-5 text-white/90" />
            <h1 className="text-4xl font-bold mb-4">AI Deadline</h1>
            <p className="text-lg text-white/80 mb-7 max-w-sm leading-relaxed">
              Quản lý deadline thông minh với sức mạnh của trí tuệ nhân tạo
            </p>
            <div className="flex items-center justify-center space-x-4 text-white/60">
              <div className="w-10 h-0.5 bg-white/30 rounded"></div>
              <span className="text-sm">Hiệu quả • Thông minh • Đơn giản</span>
              <div className="w-10 h-0.5 bg-white/30 rounded"></div>
            </div>
          </motion.div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 right-16 w-32 h-32 bg-slate-300/20 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-gray-300/20 rounded-full blur-xl"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-2/3 flex items-center justify-center p-8 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-slate-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-gray-600 bg-clip-text text-transparent">
                AI Deadline
              </h1>
            </div>
            <p className="text-gray-600">Quản lý deadline thông minh với AI</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập</h2>
              <p className="text-gray-600">Chào mừng bạn trở lại! Vui lòng đăng nhập vào tài khoản của bạn.</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg"
              >
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-400" />
                  <span className="ml-2 text-sm text-gray-600">Ghi nhớ đăng nhập</span>
                </label>
                <Link to="#" className="text-sm text-slate-600 hover:text-slate-700 font-medium">
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Login Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                 
                    Đăng nhập
                
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Hoặc</span>
                </div>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Chưa có tài khoản?{' '}
                <Link 
                  to="/register" 
                  className="text-slate-600 hover:text-slate-700 font-semibold hover:underline transition-colors"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            © 2025 AI Deadline. Tất cả quyền được bảo lưu.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
