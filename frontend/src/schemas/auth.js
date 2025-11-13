/**
 * Authentication Validation Schemas
 * Defines validation rules for auth forms (Login, Register)
 */

/**
 * Validation schema for user login
 */
export const loginSchema = {
  email: {
    required: true,
    type: 'email',
    minLength: 5,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    errorMessages: {
      required: 'Email là bắt buộc',
      type: 'Email không hợp lệ',
      pattern: 'Email không đúng định dạng (ví dụ: user@gmail.com)',
      minLength: 'Email phải có ít nhất 5 ký tự',
      maxLength: 'Email không được vượt quá 100 ký tự',
    }
  },
  password: {
    required: true,
    type: 'password',
    minLength: 6,
    maxLength: 100,
    errorMessages: {
      required: 'Mật khẩu là bắt buộc',
      minLength: 'Mật khẩu phải có ít nhất 6 ký tự',
      maxLength: 'Mật khẩu không được vượt quá 100 ký tự',
    }
  }
};

/**
 * Validation schema for user registration
 */
export const registerSchema = {
  full_name: {
    required: true,
    type: 'text',
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZỀ-ỿ\s]+$/,
    errorMessages: {
      required: 'Họ tên là bắt buộc',
      minLength: 'Họ tên phải có ít nhất 2 ký tự',
      maxLength: 'Họ tên không được vượt quá 100 ký tự',
      pattern: 'Họ tên chỉ chứa chữ cái và khoảng trắng',
    }
  },
  username: {
    required: true,
    type: 'text',
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_-]+$/,
    errorMessages: {
      required: 'Tên đăng nhập là bắt buộc',
      minLength: 'Tên đăng nhập phải có ít nhất 3 ký tự',
      maxLength: 'Tên đăng nhập không được vượt quá 30 ký tự',
      pattern: 'Tên đăng nhập chỉ chứa chữ, số, dấu _ và -',
    }
  },
  email: {
    required: true,
    type: 'email',
    minLength: 5,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    errorMessages: {
      required: 'Email là bắt buộc',
      type: 'Email không hợp lệ',
      pattern: 'Email không đúng định dạng (ví dụ: user@gmail.com)',
      minLength: 'Email phải có ít nhất 5 ký tự',
      maxLength: 'Email không được vượt quá 100 ký tự',
    }
  },
  password: {
    required: true,
    type: 'password',
    minLength: 6,
    maxLength: 100,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    errorMessages: {
      required: 'Mật khẩu là bắt buộc',
      minLength: 'Mật khẩu phải có ít nhất 6 ký tự',
      maxLength: 'Mật khẩu không được vượt quá 100 ký tự',
      pattern: 'Mật khẩu phải chứa chữ hoa, chữ thường và số',
    }
  }
};

/**
 * Validation rules for user profile update
 */
export const profileSchema = {
  full_name: {
    required: false,
    type: 'text',
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZỀ-ỿ\s]+$/,
    errorMessages: {
      minLength: 'Họ tên phải có ít nhất 2 ký tự',
      maxLength: 'Họ tên không được vượt quá 100 ký tự',
      pattern: 'Họ tên chỉ chứa chữ cái và khoảng trắng',
    }
  },
  email: {
    required: false,
    type: 'email',
    minLength: 3,
    maxLength: 100,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    errorMessages: {
      type: 'Email không hợp lệ',
      pattern: 'Email không đúng định dạng',
      minLength: 'Email phải có ít nhất 3 ký tự',
      maxLength: 'Email không được vượt quá 100 ký tự',
    }
  }
};

/**
 * Validation rules for password change
 */
export const passwordChangeSchema = {
  current_password: {
    required: true,
    type: 'password',
    minLength: 6,
    maxLength: 100,
    errorMessages: {
      required: 'Mật khẩu hiện tại là bắt buộc',
      minLength: 'Mật khẩu phải có ít nhất 6 ký tự',
      maxLength: 'Mật khẩu không được vượt quá 100 ký tự',
    }
  },
  new_password: {
    required: true,
    type: 'password',
    minLength: 6,
    maxLength: 100,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    errorMessages: {
      required: 'Mật khẩu mới là bắt buộc',
      minLength: 'Mật khẩu phải có ít nhất 6 ký tự',
      maxLength: 'Mật khẩu không được vượt quá 100 ký tự',
      pattern: 'Mật khẩu phải chứa chữ hoa, chữ thường và số',
    }
  }
};

/**
 * Validate a single field against schema
 * @param {string} fieldName - Field name to validate
 * @param {*} value - Field value
 * @param {Object} schema - Validation schema
 * @returns {string} Error message or empty string if valid
 */
export function validateField(fieldName, value, schema) {
  const field = schema[fieldName];
  if (!field) return '';

  // Check required
  if (field.required && (!value || value.toString().trim() === '')) {
    return field.errorMessages.required || 'Field is required';
  }

  // Skip further validation if not required and empty
  if (!field.required && (!value || value.toString().trim() === '')) {
    return '';
  }

  // Check min length
  if (field.minLength && value.toString().length < field.minLength) {
    return field.errorMessages.minLength || `Minimum length is ${field.minLength}`;
  }

  // Check max length
  if (field.maxLength && value.toString().length > field.maxLength) {
    return field.errorMessages.maxLength || `Maximum length is ${field.maxLength}`;
  }

  // Check pattern
  if (field.pattern && !field.pattern.test(value.toString())) {
    return field.errorMessages.pattern || 'Invalid format';
  }

  return '';
}

/**
 * Validate entire form against schema
 * @param {Object} formData - Form data object
 * @param {Object} schema - Validation schema
 * @returns {Object} Object with field names as keys and error messages as values
 */
export function validateForm(formData, schema) {
  const errors = {};

  Object.keys(schema).forEach((fieldName) => {
    const error = validateField(fieldName, formData[fieldName], schema);
    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
}

/**
 * Check if form has any errors
 * @param {Object} errors - Errors object
 * @returns {boolean}
 */
export function hasFormErrors(errors) {
  return Object.keys(errors).length > 0;
}

/**
 * Clear field error
 * @param {Object} errors - Errors object
 * @param {string} fieldName - Field name
 * @returns {Object} New errors object with field error removed
 */
export function clearFieldError(errors, fieldName) {
  const newErrors = { ...errors };
  delete newErrors[fieldName];
  return newErrors;
}
