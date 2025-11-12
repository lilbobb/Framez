export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (
  password: string
): {
  valid: boolean;
  error?: string;
} => {
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  return { valid: true };
};

export const validateName = (
  name: string
): {
  valid: boolean;
  error?: string;
} => {
  if (name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (name.trim().length > 50) {
    return { valid: false, error: 'Name must be less than 50 characters' };
  }
  return { valid: true };
};

export const validatePostContent = (
  content: string
): {
  valid: boolean;
  error?: string;
} => {
  if (content.trim().length === 0) {
    return { valid: false, error: 'Post cannot be empty' };
  }
  if (content.length > 5000) {
    return { valid: false, error: 'Post must be less than 5000 characters' };
  }
  return { valid: true };
};
