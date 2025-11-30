// Re-export API functions from api.js for backward compatibility
export { getApiBaseUrl, getUserRole, getStoredToken } from './api';

export async function isAdmin(apiBaseUrl, token) {
    const { getUserRole } = await import('./api');
    const role = await getUserRole(apiBaseUrl, token);
    return role === 'ADMIN';
}

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

export function formatDateTime(value) {
    try {
        const d = new Date(value);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
    } catch (_) {
        return value;
    }
}

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
    const hasAnyWhitespace =
        /[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B\u200C\u200D]/.test(
            password,
        );
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
        return {
            isValid: false,
            error: 'Mật khẩu ít nhất phải chứa một chữ cái thường, 1 chữ cái in hoa,1 số và 1 kí tự đặc biệt',
        };
    }

    return { isValid: true, error: null };
};

// Calculate discount percentage
export const calculateDiscount = (originalPrice, currentPrice) => {
    if (originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

// Format number với locale vi-VN
export const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('vi-VN').format(num);
};

/**
 * Tính date range dựa trên timeMode
 * @param {string} timeMode - 'day' | 'week' | 'month' | 'year' | 'custom'
 * @param {Object|null} customDateRange - { start: string, end: string } hoặc null
 * @returns {Object} { start: string, end: string } - ISO date strings (YYYY-MM-DD)
 */
export const getDateRange = (timeMode = 'day', customDateRange = null) => {
    // Nếu là custom, sử dụng date range từ props
    if (timeMode === 'custom' && customDateRange) {
        if (!customDateRange.start || !customDateRange.end) {
            // Nếu chưa chọn đủ, trả về hôm nay
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            return { start: todayStr, end: todayStr };
        }
        return {
            start: customDateRange.start,
            end: customDateRange.end,
        };
    }

    const today = new Date();
    const end = new Date(today);
    const start = new Date(today);

    switch (timeMode) {
        case 'day':
            // Chỉ hôm nay
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'week':
            // Tuần này (từ thứ 2 đến Chủ nhật)
            const dayOfWeek = today.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Nếu CN thì lùi 6 ngày, nếu không thì tính offset về thứ 2
            start.setDate(today.getDate() + mondayOffset);
            start.setHours(0, 0, 0, 0);
            // End là Chủ nhật của tuần này (thứ 2 + 6 ngày)
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            break;
        case 'month':
            // Cả tháng hiện tại (từ ngày 1 đến ngày cuối tháng)
            start.setDate(1); // Ngày đầu tháng
            start.setHours(0, 0, 0, 0);
            // End là ngày cuối cùng của tháng
            end.setMonth(today.getMonth() + 1, 0); // Ngày 0 của tháng sau = ngày cuối tháng hiện tại
            end.setHours(23, 59, 59, 999);
            break;
        case 'year':
            // Cả năm hiện tại (từ tháng 1 đến tháng 12)
            start.setMonth(0, 1); // Tháng 1, ngày 1
            start.setHours(0, 0, 0, 0);
            end.setMonth(11, 31); // Tháng 12, ngày 31
            end.setHours(23, 59, 59, 999);
            break;
        default:
            // Mặc định: hôm nay
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
    }

    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
    };
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
