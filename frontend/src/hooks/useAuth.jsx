import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { apiService } from '../services/api';

// Create Auth Context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Provides authentication state and methods to child components
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Check if user is authenticated by verifying token
   */
  const checkAuth = useCallback(async () => {
    if (isCheckingAuth) return;
    
    try {
      setIsCheckingAuth(true);
      
      // Try to get user from localStorage first (faster)
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');
      
      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Verify token is still valid by calling API
          try {
            const response = await apiService.getCurrentUser();
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            setError(null);
          } catch (err) {
            // Token is invalid, clear everything
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            setUser(null);
            setError(null);
          }
        } catch (parseErr) {
          console.error('Error parsing stored user:', parseErr);
          localStorage.removeItem('user');
          setUser(null);
        }
      } else if (token) {
        // Only token exists, try to get user from API
        try {
          const response = await apiService.getCurrentUser();
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
          setError(null);
        } catch (err) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setUser(null);
          setError(null);
        }
      }
    } finally {
      setIsCheckingAuth(false);
      setLoading(false);
    }
  }, [isCheckingAuth]);

  /**
   * Login user with email and password
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} User data and token
   */
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.login(credentials);
      const { access_token, user: responseUser } = response.data || {};

      if (!access_token) {
        throw new Error('Không nhận được token từ server');
      }

      // Store token first (important for API calls)
      localStorage.setItem('access_token', access_token);
      
      // If user is in response, use it; otherwise fetch from API
      let finalUser = responseUser;
      if (responseUser) {
        localStorage.setItem('user', JSON.stringify(responseUser));
        setUser(responseUser);
      } else {
        // Get user info from API (token is already set, so this should work)
        try {
          const userResponse = await apiService.getCurrentUser();
          finalUser = userResponse.data;
          localStorage.setItem('user', JSON.stringify(finalUser));
          setUser(finalUser);
        } catch (userErr) {
          console.error('Failed to get user info:', userErr);
          // Even if getting user fails, login is still successful
        }
      }

      return { user: finalUser, token: access_token };
    } catch (err) {
      console.error('Login error:', err);
      
      // Clear any partial data on error
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      
      // Handle different error formats
      const errorMessage = formatErrorMessage(err, 'Đăng nhập thất bại. Vui lòng thử lại.');
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Register a new user
   * @param {Object} userData - { email, full_name, password, username }
   * @returns {Promise<Object>} User data and token
   */
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.register(userData);
      const { access_token, user: responseUser } = response.data;

      if (!access_token) {
        throw new Error('Không nhận được token từ server');
      }

      // Store token and user in localStorage
      localStorage.setItem('access_token', access_token);
      
      // If user is in response, use it; otherwise fetch from API
      let finalUser = responseUser;
      if (responseUser) {
        localStorage.setItem('user', JSON.stringify(responseUser));
        setUser(responseUser);
      } else {
        // Get user info from API
        try {
          const userResponse = await apiService.getCurrentUser();
          finalUser = userResponse.data;
          localStorage.setItem('user', JSON.stringify(finalUser));
          setUser(finalUser);
        } catch (userErr) {
          console.error('Failed to get user info:', userErr);
        }
      }

      return { user: finalUser, token: access_token };
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle different error formats
      const errorMessage = formatErrorMessage(err, 'Đăng ký thất bại. Vui lòng thử lại.');
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout current user
   */
  const logout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch (err) {
      // Continue with logout even if API call fails
      console.error('Logout error:', err);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
      setError(null);
    }
  }, []);

  /**
   * Get current authenticated user
   * @returns {Promise<Object>} User data
   */
  const getCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getCurrentUser();
      // Update both state and localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = formatErrorMessage(err, 'Không thể lấy thông tin người dùng');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated user data
   */
  const updateProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implement updateProfile endpoint in backend
      throw new Error('Chức năng cập nhật hồ sơ chưa được triển khai');
    } catch (err) {
      const errorMessage = formatErrorMessage(err, 'Không thể cập nhật hồ sơ');
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Change password
   * @param {Object} passwordData - { current_password, new_password }
   * @returns {Promise<void>}
   */
  const changePassword = useCallback(async (passwordData) => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implement changePassword endpoint in backend
      throw new Error('Chức năng thay đổi mật khẩu chưa được triển khai');
    } catch (err) {
      const errorMessage = formatErrorMessage(err, 'Không thể thay đổi mật khẩu');
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  const isAuthenticated = useCallback(() => {
    return !!user && !!localStorage.getItem('access_token');
  }, [user]);

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission name
   * @returns {boolean}
   */
  const hasPermission = useCallback((permission) => {
    return user?.permissions?.includes(permission) || isAdmin();
  }, [user]);

  /**
   * Get user token
   * @returns {string|null}
   */
  const getToken = useCallback(() => {
    return localStorage.getItem('access_token');
  }, []);

  /**
   * Refresh token
   * @returns {Promise<string>} New token
   */
  const refreshToken = useCallback(async () => {
    try {
      const response = await apiService.refreshToken();
      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      return access_token;
    } catch (err) {
      // Token refresh failed, logout user
      await logout();
      throw err;
    }
  }, [logout]);

  const value = {
    // State
    user,
    loading,
    error,
    isCheckingAuth,
    
    // Auth methods
    login,
    register,
    logout,
    checkAuth,
    refreshToken,
    
    // User methods
    getCurrentUser,
    updateProfile,
    changePassword,
    
    // Helper methods
    isAuthenticated,
    isAdmin,
    hasPermission,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * Custom hook to access authentication context
 * @returns {Object} Auth context value
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * useLogin Hook
 * Convenience hook for login functionality
 * @returns {Object} Login-related methods and states
 */
export function useLogin() {
  const { login, loading, error, user } = useAuth();
  
  const [formError, setFormError] = useState('');

  const handleLogin = useCallback(async (credentials) => {
    setFormError('');
    try {
      return await login(credentials);
    } catch (err) {
      setFormError(err.message);
      throw err;
    }
  }, [login]);

  return {
    login: handleLogin,
    loading,
    error: formError || error,
    user,
    setError: setFormError,
  };
}

/**
 * useRegister Hook
 * Convenience hook for registration functionality
 */
export function useRegister() {
  const { register, loading, error, user } = useAuth();
  
  const [formError, setFormError] = useState('');

  const handleRegister = useCallback(async (userData) => {
    setFormError('');
    try {
      return await register(userData);
    } catch (err) {
      setFormError(err.message);
      throw err;
    }
  }, [register]);

  return {
    register: handleRegister,
    loading,
    error: formError || error,
    user,
    setError: setFormError,
  };
}

/**
 * useLogout Hook
 * Convenience hook for logout functionality
 */
export function useLogout() {
  const { logout, loading } = useAuth();
  
  return {
    logout,
    loading,
  };
}

/**
 * Helper function to format error messages
 * @param {Error} err - Error object
 * @param {string} defaultMessage - Default error message
 * @returns {string} Formatted error message
 */
function formatErrorMessage(err, defaultMessage = 'An error occurred') {
  if (err.response) {
    const errorData = err.response.data;
    
    if (errorData?.detail) {
      if (Array.isArray(errorData.detail)) {
        return errorData.detail.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
      } else {
        return errorData.detail;
      }
    } else if (errorData?.message) {
      return errorData.message;
    }
  } else if (err.message) {
    return err.message;
  } else if (err.request) {
    return 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.';
  }
  
  return defaultMessage;
}

export default useAuth;

