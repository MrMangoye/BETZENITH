// src/utils/passwordGenerator.js

/**
 * Generate a strong random password with customizable options
 * @param {number} length - Password length (default: 12, min: 8, max: 32)
 * @param {boolean} useUppercase - Include uppercase letters (A-Z)
 * @param {boolean} useLowercase - Include lowercase letters (a-z)
 * @param {boolean} useNumbers - Include numbers (0-9)
 * @param {boolean} useSymbols - Include special characters (!@#$%^&* etc)
 * @returns {string} Generated password
 */
export const generatePassword = (
    length = 12,
    useUppercase = true,
    useLowercase = true,
    useNumbers = true,
    useSymbols = true
  ) => {
    // Character sets
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
    // Build character pool based on selected options
    let chars = '';
    if (useUppercase) chars += uppercaseChars;
    if (useLowercase) chars += lowercaseChars;
    if (useNumbers) chars += numberChars;
    if (useSymbols) chars += symbolChars;
  
    // Fallback to lowercase if nothing selected
    if (chars === '') chars = lowercaseChars;
  
    // Ensure length is within bounds
    const validLength = Math.min(Math.max(length, 8), 32);
  
    // Generate initial password
    let password = '';
    for (let i = 0; i < validLength; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }
  
    // Ensure at least one character from each selected set
    let passwordArray = password.split('');
    
    if (useUppercase && !/[A-Z]/.test(password)) {
      const randomPos = Math.floor(Math.random() * passwordArray.length);
      passwordArray[randomPos] = uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
    }
    
    if (useLowercase && !/[a-z]/.test(password)) {
      const randomPos = Math.floor(Math.random() * passwordArray.length);
      passwordArray[randomPos] = lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
    }
    
    if (useNumbers && !/[0-9]/.test(password)) {
      const randomPos = Math.floor(Math.random() * passwordArray.length);
      passwordArray[randomPos] = numberChars[Math.floor(Math.random() * numberChars.length)];
    }
    
    if (useSymbols && !/[^A-Za-z0-9]/.test(password)) {
      const randomPos = Math.floor(Math.random() * passwordArray.length);
      passwordArray[randomPos] = symbolChars[Math.floor(Math.random() * symbolChars.length)];
    }
  
    // Shuffle the array to mix up the guaranteed characters
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }
  
    return passwordArray.join('');
  };
  
  /**
   * Calculate password strength percentage
   * @param {string} password - Password to evaluate
   * @returns {number} Strength percentage (0-100)
   */
  export const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length checks (up to 40 points)
    if (password.length >= 8) strength += 20;
    if (password.length >= 10) strength += 10;
    if (password.length >= 12) strength += 10;
    
    // Character variety checks (up to 60 points)
    if (/[A-Z]/.test(password)) strength += 15; // Uppercase
    if (/[a-z]/.test(password)) strength += 15; // Lowercase
    if (/[0-9]/.test(password)) strength += 15; // Numbers
    if (/[^A-Za-z0-9]/.test(password)) strength += 15; // Special characters
    
    // Bonus for mixing character types
    let typeCount = 0;
    if (/[A-Z]/.test(password)) typeCount++;
    if (/[a-z]/.test(password)) typeCount++;
    if (/[0-9]/.test(password)) typeCount++;
    if (/[^A-Za-z0-9]/.test(password)) typeCount++;
    
    if (typeCount >= 3) strength += 5;
    if (typeCount >= 4) strength += 5;
    
    return Math.min(strength, 100);
  };
  
  /**
   * Get password strength label and color based on strength percentage
   * @param {number} strength - Strength percentage (0-100)
   * @returns {Object} Label and color classes
   */
  export const getPasswordStrengthInfo = (strength) => {
    if (strength < 30) {
      return { 
        label: 'Very Weak', 
        color: 'text-red-400', 
        bgColor: 'bg-red-500',
        message: 'Too easy to guess'
      };
    } else if (strength < 50) {
      return { 
        label: 'Weak', 
        color: 'text-orange-400', 
        bgColor: 'bg-orange-500',
        message: 'Add more variety'
      };
    } else if (strength < 70) {
      return { 
        label: 'Medium', 
        color: 'text-yellow-400', 
        bgColor: 'bg-yellow-500',
        message: 'Could be stronger'
      };
    } else if (strength < 90) {
      return { 
        label: 'Strong', 
        color: 'text-green-400', 
        bgColor: 'bg-green-500',
        message: 'Good password'
      };
    } else {
      return { 
        label: 'Very Strong', 
        color: 'text-emerald-400', 
        bgColor: 'bg-emerald-500',
        message: 'Excellent password'
      };
    }
  };
  
  /**
   * Validate password against common rules
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with errors
   */
  export const validatePassword = (password) => {
    const errors = [];
    
    if (!password) {
      errors.push('Password is required');
      return { valid: false, errors };
    }
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    
    if (password.length > 32) {
      errors.push('Password must be less than 32 characters');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Include at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Include at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Include at least one number');
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Include at least one special character');
    }
    
    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Avoid repeated characters (like "aaa")');
    }
    
    if (/^(password|123456|qwerty|admin|letmein)/i.test(password)) {
      errors.push('Avoid common passwords');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Generate a memorable passphrase (easier to remember)
   * @param {number} wordCount - Number of words (default: 4)
   * @returns {string} Memorable passphrase
   */
  export const generatePassphrase = (wordCount = 4) => {
    const wordList = [
      'apple', 'bird', 'cloud', 'dragon', 'eagle', 'flower', 'gold', 'heart',
      'ice', 'jungle', 'king', 'lion', 'moon', 'night', 'ocean', 'phoenix',
      'queen', 'river', 'star', 'thunder', 'unicorn', 'volcano', 'water', 'xenon',
      'yellow', 'zenith', 'alpha', 'beta', 'gamma', 'delta', 'omega', 'sigma'
    ];
    
    const numbers = Math.floor(Math.random() * 100);
    const symbols = ['!', '@', '#', '$', '%', '&', '*'][Math.floor(Math.random() * 7)];
    
    let passphrase = [];
    for (let i = 0; i < wordCount; i++) {
      const randomIndex = Math.floor(Math.random() * wordList.length);
      passphrase.push(wordList[randomIndex]);
    }
    
    // Capitalize first letter of each word
    passphrase = passphrase.map(word => word.charAt(0).toUpperCase() + word.slice(1));
    
    // Add numbers and symbol
    return passphrase.join('') + numbers + symbols;
  };