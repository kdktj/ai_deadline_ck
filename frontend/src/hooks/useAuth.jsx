import { useState, useEffect, createContext, useContext } from 'react';
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

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Check if user is authenticated by verifying token
   */
  const checkAuth = async () => {
    try {
      // Try to get user from localStorage first (faster)
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');
      
      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          // Verify token is still valid by calling API
          const response = await apiService.getCurrentUser();
          setUser(response.data);
          // Update stored user
          localStorage.setItem('user', JSON.stringify(response.data));
          setError(null);
        } catch (err) {
          // Token is invalid, clear everything
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setUser(null);
          setError(null);
        }
      } else if (token) {
        // Only token exists, try to get user from API
        const response = await apiService.getCurrentUser();
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        setError(null);
      }
    } catch (err) {
      // Token is invalid or expired
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user with email/username and password
   * @param {Object} credentials - { email/username, password }
   * @returns {Promise<Object>} User data and token
   */
  const login = async (credentials) => {
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
          // User can be fetched later
        }
      }

      return { user: finalUser, token: access_token };
    } catch (err) {
      console.error('Login error:', err);
      
      // Clear any partial data on error
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      
      // Handle different error formats
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      
      if (err.response) {
        // Backend returned an error
        const errorData = err.response.data;
        if (errorData?.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
          } else {
            errorMessage = errorData.detail;
          }
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.request) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new user
   * @param {Object} userData - { email, username, full_name, password }
   * @returns {Promise<Object>} User data and token
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.register(userData);
      const { access_token, user: responseUser } = response.data;

      // Store token and user in localStorage (matching login.jsx pattern)
      localStorage.setItem('access_token', access_token);
      
      // If user is in response, use it; otherwise fetch from API
      let finalUser = responseUser;
      if (responseUser) {
        localStorage.setItem('user', JSON.stringify(responseUser));
        setUser(responseUser);
      } else {
        // Get user info from API
        const userResponse = await apiService.getCurrentUser();
        finalUser = userResponse.data;
        localStorage.setItem('user', JSON.stringify(finalUser));
        setUser(finalUser);
      }

      return { user: finalUser, token: access_token };
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle different error formats
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response) {
        // Backend returned an error
        const errorData = err.response.data;
        
        if (errorData.detail) {
          // Single error message
          if (Array.isArray(errorData.detail)) {
            // Pydantic validation errors
            errorMessage = errorData.detail.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
          } else {
            errorMessage = errorData.detail;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.request) {
        errorMessage = 'Cannot connect to server. Please check if backend is running.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout current user
   */
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      // Continue with logout even if API call fails
      console.error('Logout error:', err);
    } finally {
      // Clear local storage and state (matching login.jsx pattern)
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
      setError(null);
    }
  };

  /**
   * Get current authenticated user
   * @returns {Promise<Object>} User data
   */
  const getCurrentUser = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCurrentUser();
      // Update both state and localStorage (matching login.jsx pattern)
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get user information');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated user data
   */
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implement updateProfile endpoint in backend
      throw new Error('Update profile endpoint not yet implemented');
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('access_token');
  };

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    getCurrentUser,
    updateProfile,
    isAuthenticated,
    isAdmin,
    checkAuth,
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

export default useAuth;

