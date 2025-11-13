/**
 * Authentication Utilities
 * Helper functions for authentication operations
 */

/**
 * Get access token from localStorage
 * @returns {string|null} Access token or null
 */
export function getAccessToken() {
  return localStorage.getItem('access_token');
}

/**
 * Set access token in localStorage
 * @param {string} token - Access token
 */
export function setAccessToken(token) {
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
}

/**
 * Get user from localStorage
 * @returns {Object|null} User object or null
 */
export function getStoredUser() {
  const user = localStorage.getItem('user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (err) {
    console.error('Error parsing stored user:', err);
    return null;
  }
}

/**
 * Set user in localStorage
 * @param {Object} user - User object
 */
export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
}

/**
 * Clear all auth data from localStorage
 */
export function clearAuthData() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isUserAuthenticated() {
  const token = getAccessToken();
  const user = getStoredUser();
  return !!token && !!user;
}

/**
 * Get user ID from stored user
 * @returns {number|null}
 */
export function getUserId() {
  const user = getStoredUser();
  return user?.id || null;
}

/**
 * Get user email from stored user
 * @returns {string|null}
 */
export function getUserEmail() {
  const user = getStoredUser();
  return user?.email || null;
}

/**
 * Get user name from stored user
 * @returns {string|null}
 */
export function getUserName() {
  const user = getStoredUser();
  return user?.full_name || user?.username || null;
}

/**
 * Get user role from stored user
 * @returns {string|null}
 */
export function getUserRole() {
  const user = getStoredUser();
  return user?.role || null;
}

/**
 * Check if user is admin
 * @returns {boolean}
 */
export function isUserAdmin() {
  return getUserRole() === 'admin';
}

/**
 * Check if user has specific permission
 * @param {string} permission - Permission name
 * @returns {boolean}
 */
export function hasUserPermission(permission) {
  const user = getStoredUser();
  return user?.permissions?.includes(permission) || isUserAdmin();
}

/**
 * Decode JWT token (without verification)
 * WARNING: This is for client-side usage only. Do not use for security-critical operations.
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null
 */
export function decodeToken(token) {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (err) {
    console.error('Error decoding token:', err);
    return null;
  }
}

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean}
 */
export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  // Check if token expires in the next 60 seconds
  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const timeUntilExpiration = expirationTime - currentTime;

  return timeUntilExpiration < 60000; // Less than 60 seconds
}

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
export function getTokenExpirationTime(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }

  return new Date(decoded.exp * 1000);
}

/**
 * Get token expiration timestamp
 * @param {string} token - JWT token
 * @returns {number|null} Expiration timestamp in seconds or null
 */
export function getTokenExpirationTimestamp(token) {
  const decoded = decodeToken(token);
  return decoded?.exp || null;
}

/**
 * Format auth error message
 * @param {Error} err - Error object
 * @param {string} defaultMessage - Default error message
 * @returns {string} Formatted error message
 */
export function formatAuthError(err, defaultMessage = 'Đã xảy ra lỗi') {
  if (!err) return defaultMessage;

  // Handle axios/fetch error response
  if (err.response) {
    const data = err.response.data;

    if (data?.detail) {
      // Array of validation errors
      if (Array.isArray(data.detail)) {
        return data.detail
          .map((e) => e.msg || e.message || JSON.stringify(e))
          .join(', ');
      }
      // Single error message
      return data.detail;
    }

    if (data?.message) {
      return data.message;
    }

    // HTTP status code error
    return `Lỗi ${err.response.status}: ${err.response.statusText}`;
  }

  // Network error
  if (err.request && !err.response) {
    return 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
  }

  // Error message
  if (err.message) {
    return err.message;
  }

  return defaultMessage;
}

/**
 * Create authorization header for API requests
 * @returns {Object} Header object with authorization
 */
export function getAuthHeader() {
  const token = getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Object with isValid flag and issues array
 */
export function validatePasswordStrength(password) {
  const issues = [];

  if (!password || password.length < 6) {
    issues.push('Mật khẩu phải có ít nhất 6 ký tự');
  }

  if (password.length > 100) {
    issues.push('Mật khẩu không được vượt quá 100 ký tự');
  }

  if (!/[a-z]/.test(password)) {
    issues.push('Mật khẩu phải chứa ít nhất một chữ thường');
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('Mật khẩu phải chứa ít nhất một chữ hoa');
  }

  if (!/\d/.test(password)) {
    issues.push('Mật khẩu phải chứa ít nhất một chữ số');
  }

  return {
    isValid: issues.length === 0,
    issues,
    strength: calculatePasswordStrength(password),
  };
}

/**
 * Calculate password strength (0-100)
 * @param {string} password - Password to check
 * @returns {number} Strength score (0-100)
 */
export function calculatePasswordStrength(password) {
  let strength = 0;

  if (!password) return strength;

  // Length
  if (password.length >= 6) strength += 10;
  if (password.length >= 8) strength += 10;
  if (password.length >= 12) strength += 10;

  // Character types
  if (/[a-z]/.test(password)) strength += 15; // lowercase
  if (/[A-Z]/.test(password)) strength += 15; // uppercase
  if (/\d/.test(password)) strength += 15; // digits
  if (/[^a-zA-Z\d]/.test(password)) strength += 20; // special characters

  return Math.min(strength, 100);
}

/**
 * Get password strength label
 * @param {string} password - Password to check
 * @returns {string} Strength label (Weak, Fair, Good, Strong, Very Strong)
 */
export function getPasswordStrengthLabel(password) {
  const strength = calculatePasswordStrength(password);

  if (strength < 20) return 'Rất yếu';
  if (strength < 40) return 'Yếu';
  if (strength < 60) return 'Bình thường';
  if (strength < 80) return 'Mạnh';
  return 'Rất mạnh';
}

/**
 * Sanitize user input (basic XSS prevention)
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Format user display name
 * @param {string} fullName - Full name
 * @param {string} username - Username
 * @returns {string} Display name
 */
export function formatUserDisplayName(fullName, username) {
  if (fullName && fullName.trim()) {
    return fullName.trim();
  }
  if (username && username.trim()) {
    return username.trim();
  }
  return 'User';
}

/**
 * Format user initial avatar
 * @param {string} fullName - Full name
 * @returns {string} Two letter initials
 */
export function getUserInitials(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return 'U';
  }

  const names = fullName.trim().split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }

  return (fullName[0] + (fullName[1] || '')).toUpperCase().slice(0, 2);
}

/**
 * Check if localStorage is available
 * @returns {boolean}
 */
export function isLocalStorageAvailable() {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Build query string from parameters
 * @param {Object} params - Parameters object
 * @returns {string} Query string
 */
export function buildQueryString(params) {
  return Object.keys(params)
    .filter((key) => params[key] !== null && params[key] !== undefined)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}
