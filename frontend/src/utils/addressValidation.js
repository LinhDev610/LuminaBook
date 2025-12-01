import { validatePhoneNumberField } from './phoneNumberValidation';

export const validateAddressForm = (form) => {
    const errors = {};

    if (!form.recipientName?.trim()) {
        errors.recipientName = 'Vui lòng nhập tên người nhận';
    }

    const phoneErrors = validatePhoneNumberField(form.recipientPhoneNumber, 'recipientPhoneNumber');
    Object.assign(errors, phoneErrors);

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
