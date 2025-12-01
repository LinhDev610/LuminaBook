export const isValidVietnamPhoneNumber = (phone) => {
    if (!phone) return false;
    const trimmed = phone.trim();
    // Định dạng cơ bản: 10 số và bắt đầu bằng 0
    return /^0\d{9}$/.test(trimmed);
};

export const validatePhoneNumberField = (phone, fieldName = 'phone') => {
    const errors = {};
    const trimmed = phone?.trim();

    if (!trimmed) {
        errors[fieldName] = 'Vui lòng nhập số điện thoại';
    } else if (!/^0\d{9}$/.test(trimmed)) {
        errors[fieldName] = 'Số điện thoại phải gồm 10 số và bắt đầu bằng 0';
    }

    return errors;
};


