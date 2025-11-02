package com.lumina_book.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import lombok.Getter;

@Getter
public enum ErrorCode {
    // Lỗi không xác định được -> Internal server error
    // Lỗi liên quan input user -> Bad_request
    // Thực hiện request mà không thấy resource -> 404: not found
    // Không thể đăng nhập -> 401: unauthorized
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1003, "INVALID_PASSWORD", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1004, "User không tồn tại", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1005, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1006, "You do not have permission", HttpStatus.FORBIDDEN),
    INVALID_DOB(1007, "Your age must be as least {min}", HttpStatus.BAD_REQUEST),
    EMAIL_SEND_FAILED(1008, "Failed to send email", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_OTP(1009, "Mã OTP không đúng, yêu cầu nhập lại", HttpStatus.BAD_REQUEST),
    TICKET_NOT_EXISTED(1010, "Ticket không tồn tại", HttpStatus.NOT_FOUND),

    // Promotion
    PROMOTION_NOT_EXISTED(2001, "Khuyến mãi không tồn tại", HttpStatus.NOT_FOUND),
    PROMOTION_CODE_ALREADY_EXISTS(2002, "Mã khuyến mãi đã tồn tại", HttpStatus.BAD_REQUEST),
    PROMOTION_NOT_PENDING(2003, "Khuyến mãi không ở trạng thái chờ duyệt", HttpStatus.BAD_REQUEST),

    // Voucher
    VOUCHER_NOT_EXISTED(3001, "Khuyến mãi không tồn tại", HttpStatus.NOT_FOUND),
    VOUCHER_CODE_ALREADY_EXISTS(3002, "Mã khuyến mãi đã tồn tại", HttpStatus.BAD_REQUEST),
    VOUCHER_NOT_PENDING(3003, "Khuyến mãi không ở trạng thái chờ duyệt", HttpStatus.BAD_REQUEST),
    VOUCHER_EXPIRED(3004, "Voucher đã hết hạn sử dụng", HttpStatus.BAD_REQUEST),
    VOUCHER_SOLD_OUT(3005, "Voucher đã hết lượt sử dụng", HttpStatus.BAD_REQUEST),
    INVALID_VOUCHER_MINIUM(3006, "Không thỏa mãn giá trị tối thiểu của voucher", HttpStatus.BAD_REQUEST),

    // Banner
    BANNER_NOT_EXISTED(4001, "Banner không tồn tại", HttpStatus.NOT_FOUND),

    // REVIEW
    REVIEW_NOT_EXISTED(5001, "Review không tồn tại", HttpStatus.NOT_FOUND),

    // PRODUCT
    PRODUCT_NOT_EXISTED(6001, "Product không tồn tại", HttpStatus.NOT_FOUND),
    CATEGORY_NOT_EXISTED(6004, "Danh mục không tồn tại", HttpStatus.NOT_FOUND),
    OUT_OF_STOCK(6002, "Hết hàng", HttpStatus.BAD_REQUEST),

    // ORDER - SHIPMENT - CART
    CART_ITEM_NOT_EXISTED(7001, "Không tồn tại sản phẩm trong giỏ hàng", HttpStatus.NOT_FOUND),
    ORDER_NOT_EXISTED(7002, "Đơn hàng không tồn tại", HttpStatus.NOT_FOUND),
    EXTERNAL_SERVICE_ERROR(7003, "Lỗi kết nối dịch vụ vận chuyển", HttpStatus.BAD_GATEWAY);

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
