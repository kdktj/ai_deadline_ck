import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Sparkles } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

// Simple components (if not in components folder, define inline)
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-xl p-8 ${className}`}>
    {children}
  </div>
);

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <input
      {...props}
      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
    />
  </div>
);

const Button = ({ children, loading, className = "", ...props }) => (
  <button
    {...props}
    disabled={loading}
    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all 
      bg-gradient-to-r from-primary-600 to-purple-600 text-white 
      hover:from-primary-700 hover:to-purple-700 
      active:scale-95 
      disabled:opacity-50 disabled:cursor-not-allowed 
      shadow-lg hover:shadow-xl
      ${className}`}
  >
    {loading ? "Đang xử lý..." : children}
  </button>
);

export default function Login() {
  const navigate = useNavigate();
  const { login, loading: authLoading, error: authError } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Hiển thị error từ auth hook
  const displayError = error || authError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Chuẩn bị credentials - API có thể nhận email hoặc username
      const credentials = {
        username: formData.email, // Backend chấp nhận cả email và username trong field username
        password: formData.password
      };

      // Sử dụng useAuth hook để đăng nhập
      // Login hook sẽ tự động lưu token và user vào localStorage
      const result = await login(credentials);
      
      // Hiển thị thông báo thành công
      if (result && result.token) {
        setSuccess("Đăng nhập thành công!");
        // Reset form
        setFormData({ email: "", password: "" });
      } else {
        setError("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      // Lấy error từ hook hoặc từ exception
      const errorMessage = authError || err.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(errorMessage);
      console.error('Login failed:', err);
    }
  };

  // Prevent rendering errors
  if (!motion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <p className="text-red-600">Lỗi: framer-motion chưa được cài đặt. Vui lòng chạy: npm install framer-motion</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <Sparkles className="w-10 h-10 text-primary-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              AI Deadline
            </h1>
          </motion.div>
          <p className="text-gray-600">Quản lý deadline thông minh với AI</p>
        </div>

        <Card>
          {/* <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <LogIn className="w-6 h-6" />
            Đăng nhập
          </h2> */}

          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
            >
              {displayError}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm"
            >
              {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              key="email"
              type="email"
              label="Email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              autoComplete="off"
              required
            />

            <Input
              key="password"
              type="password"
              label="Mật khẩu"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              autoComplete="off"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={authLoading}
            >
              <LogIn className="w-5 h-5" />
              Đăng nhập
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Đăng ký ngay
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}