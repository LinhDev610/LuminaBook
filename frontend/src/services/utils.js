// Utils
// Hàm tiện ích

// Format currency
export const formatCurrency = (amount, currency = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

// Format date
export const formatDate = (date, options = {}) => {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };

    return new Intl.DateTimeFormat('vi-VN', {
        ...defaultOptions,
        ...options,
    }).format(new Date(date));
};

// Validate email
export const isValidEmail = (email) => {
    // Kiểm tra dấu chấm liên tiếp trước
    if (email.includes('..')) {
        return false;
    }
    
    // Kiểm tra dấu chấm ở đầu hoặc cuối tên email
    const [localPart, domainPart] = email.split('@');
    if (!localPart || !domainPart) {
        return false;
    }
    
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
        return false;
    }
    
    if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
        return false;
    }
    
    const emailRe = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRe.test(email);
};

// Validate password
export const validatePassword = (password, confirmPassword = null) => {
    // Kiểm tra độ dài
    if (password.length < 8) {
        return { isValid: false, error: 'Mật khẩu quá ngắn, tối thiểu 8 ký tự' };
    }
    if (password.length > 32) {
        return { isValid: false, error: 'Mật khẩu quá dài, tối đa 32 ký tự' };
    }
    
    // Kiểm tra khoảng trắng
    const hasAnyWhitespace = /[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B\u200C\u200D]/.test(password);
    if (hasAnyWhitespace) {
        return { isValid: false, error: 'Mật khẩu không được chứa khoảng trắng.' };
    }
    
    // Kiểm tra confirm password nếu có
    if (confirmPassword !== null && password !== confirmPassword) {
        return { isValid: false, error: 'Mật khẩu không khớp' };
    }
    
    // Kiểm tra các yêu cầu về ký tự
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    if (!(hasLowercase && hasUppercase && hasDigit && hasSpecial)) {
        return { isValid: false, error: 'Mật khẩu ít nhất phải chứa một chữ cái thường, 1 chữ cái in hoa,1 số và 1 kí tự đặc biệt' };
    }
    
    return { isValid: true, error: null };
};

// Calculate discount percentage
export const calculateDiscount = (originalPrice, currentPrice) => {
    if (originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

// Local storage helpers
export const storage = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error getting from localStorage:', error);
            return defaultValue;
        }
    },

    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error setting to localStorage:', error);
            return false;
        }
    },

    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },
};
