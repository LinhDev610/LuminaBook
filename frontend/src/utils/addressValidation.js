export const validateAddressForm = (form) => {
    const errors = {};

    if (!form.recipientName?.trim()) {
        errors.recipientName = 'Vui lòng nhập tên người nhận';
    }

    if (!form.recipientPhoneNumber?.trim()) {
        errors.recipientPhoneNumber = 'Vui lòng nhập số điện thoại';
    } else if (!/^0\d{9}$/.test(form.recipientPhoneNumber.trim())) {
        errors.recipientPhoneNumber = 'Số điện thoại phải gồm 10 số và bắt đầu bằng 0';
    }

    if (!form.provinceID) {
        errors.provinceID = 'Vui lòng chọn tỉnh/thành';
    }

    if (!form.districtID) {
        errors.districtID = 'Vui lòng chọn quận/huyện';
    }

    if (!form.wardCode) {
        errors.wardCode = 'Vui lòng chọn phường/xã';
    }

    if (!form.address?.trim()) {
        errors.address = 'Vui lòng nhập địa chỉ chi tiết';
    }

    return errors;
};
