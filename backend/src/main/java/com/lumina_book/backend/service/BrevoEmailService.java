package com.lumina_book.backend.service;

import java.text.NumberFormat;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;
import com.lumina_book.backend.entity.Order;
import com.lumina_book.backend.entity.OrderItem;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BrevoEmailService {

    RestTemplate restTemplate = new RestTemplate();
    String apiKey;
    String senderEmail;

    public BrevoEmailService(
            @Value("${brevo.api.key}") String apiKey, @Value("${brevo.sender.email}") String senderEmail) {
        this.apiKey = apiKey;
        this.senderEmail = senderEmail;
    }

    private static final String BREVO_API_URL =
            "https://api.brevo.com/v3/smtp/email"; // correct Brevo transactional email endpoint

    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            // Prepare request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("sender", Map.of("email", senderEmail, "name", "LuminaBook"));
            requestBody.put("to", new Object[] {Map.of("email", toEmail, "name", "User")});
            requestBody.put("subject", "Mã xác thực OTP - LuminaBook");

            String emailContent = String.format(
                    "Xin chào,\n\n" + "Mã xác thực OTP của bạn là: %s\n\n"
                            + "Mã này có hiệu lực trong 5 phút.\n"
                            + "Vui lòng không chia sẻ mã này với bất kỳ ai.\n\n"
                            + "Trân trọng,\n"
                            + "Đội ngũ LuminaBook",
                    otpCode);

            requestBody.put("textContent", emailContent);
            requestBody.put("htmlContent", emailContent.replace("\n", "<br>"));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Send request
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(BREVO_API_URL, request, Map.class);

            if (response.getStatusCode() != HttpStatus.CREATED) {
                log.error("Failed to send email via Brevo API. Status: {}", response.getStatusCode());
                throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
            }

        } catch (Exception e) {
            log.error("Failed to send email via Brevo API to: {} - Error: {}", toEmail, e.getMessage(), e);
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    public void sendStaffPasswordEmail(String toEmail, String staffName, String password, String role) {
        try {
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            // Prepare request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("sender", Map.of("email", senderEmail, "name", "LuminaBook Admin"));
            requestBody.put("to", new Object[] {Map.of("email", toEmail, "name", staffName)});
            requestBody.put("subject", "Thông tin tài khoản nhân viên - LuminaBook");

            String emailContent = String.format(
                    "Xin chào %s,\n\n"
                            + "Chào mừng bạn đến với đội ngũ LuminaBook!\n\n"
                            + "Thông tin tài khoản của bạn:\n"
                            + "- Email: %s\n"
                            + "- Mật khẩu: %s\n"
                            + "- Vai trò: %s\n\n"
                            + "Vui lòng đăng nhập và thay đổi mật khẩu ngay lần đầu tiên để bảo mật tài khoản.\n"
                            + "Địa chỉ đăng nhập: http://localhost:3000\n\n"
                            + "Lưu ý: Vui lòng không chia sẻ thông tin này với bất kỳ ai.\n\n"
                            + "Trân trọng,\n"
                            + "Đội ngũ LuminaBook",
                    staffName, toEmail, password, role);

            requestBody.put("textContent", emailContent);
            requestBody.put("htmlContent", emailContent.replace("\n", "<br>"));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Send request
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(BREVO_API_URL, request, Map.class);

            if (response.getStatusCode() != HttpStatus.CREATED) {
                log.error("Failed to send staff password email via Brevo API. Status: {}", response.getStatusCode());
                throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
            }

        } catch (Exception e) {
            log.error(
                    "Failed to send staff password email via Brevo API to: {} - Error: {}", toEmail, e.getMessage(), e);
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    public void sendAccountLockedEmail(String toEmail, String userName, String roleName) {
        try {
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            // Prepare request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("sender", Map.of("email", senderEmail, "name", "LuminaBook Admin"));
            requestBody.put("to", new Object[] {Map.of("email", toEmail, "name", userName != null ? userName : "User")});
            requestBody.put("subject", "Thông báo: Tài khoản của bạn đã bị khóa - LuminaBook");

            String roleDisplayName = "Khách hàng";
            if (roleName != null) {
                switch (roleName.toUpperCase()) {
                    case "STAFF":
                        roleDisplayName = "Nhân viên";
                        break;
                    case "CUSTOMER_SUPPORT":
                        roleDisplayName = "Nhân viên chăm sóc khách hàng";
                        break;
                    case "CUSTOMER":
                    default:
                        roleDisplayName = "Khách hàng";
                        break;
                }
            }

            String emailContent = String.format(
                    "Xin chào %s,\n\n"
                            + "Chúng tôi xin thông báo rằng tài khoản %s của bạn tại LuminaBook đã bị khóa.\n\n"
                            + "Thông tin tài khoản:\n"
                            + "- Email: %s\n"
                            + "- Vai trò: %s\n\n"
                            + "Khi tài khoản bị khóa, bạn sẽ không thể đăng nhập vào hệ thống.\n\n"
                            + "Nếu bạn cho rằng đây là sự nhầm lẫn hoặc cần được hỗ trợ, vui lòng liên hệ với chúng tôi:\n"
                            + "- Email hỗ trợ: %s\n"
                            + "- Hoặc liên hệ qua hotline:  \n\n"
                            + "Chúng tôi sẽ xem xét và phản hồi yêu cầu của bạn trong thời gian sớm nhất.\n\n"
                            + "Trân trọng,\n"
                            + "Đội ngũ LuminaBook",
                    userName != null ? userName : "Quý khách", roleDisplayName, toEmail, roleDisplayName, senderEmail);

            requestBody.put("textContent", emailContent);
            requestBody.put("htmlContent", emailContent.replace("\n", "<br>"));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Send request
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(BREVO_API_URL, request, Map.class);

            if (response.getStatusCode() != HttpStatus.CREATED) {
                log.error("Failed to send account locked email via Brevo API. Status: {}", response.getStatusCode());
                throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
            }

        } catch (Exception e) {
            log.error(
                    "Failed to send account locked email via Brevo API to: {} - Error: {}", toEmail, e.getMessage(), e);
            // Don't throw exception here - account lock should succeed even if email fails
            // Just log the error
        }
    }

    public void sendAccountUnlockedEmail(String toEmail, String userName, String roleName) {
        try {
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            // Prepare request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("sender", Map.of("email", senderEmail, "name", "LuminaBook Admin"));
            requestBody.put("to", new Object[] {Map.of("email", toEmail, "name", userName != null ? userName : "User")});
            requestBody.put("subject", "Thông báo: Tài khoản của bạn đã được mở khóa - LuminaBook");

            String roleDisplayName = "Khách hàng";
            if (roleName != null) {
                switch (roleName.toUpperCase()) {
                    case "STAFF":
                        roleDisplayName = "Nhân viên";
                        break;
                    case "CUSTOMER_SUPPORT":
                        roleDisplayName = "Nhân viên chăm sóc khách hàng";
                        break;
                    case "CUSTOMER":
                    default:
                        roleDisplayName = "Khách hàng";
                        break;
                }
            }

            String emailContent = String.format(
                    "Xin chào %s,\n\n"
                            + "Chúng tôi xin thông báo rằng tài khoản %s của bạn tại LuminaBook đã được mở khóa.\n\n"
                            + "Thông tin tài khoản:\n"
                            + "- Email: %s\n"
                            + "- Vai trò: %s\n\n"
                            + "Bây giờ bạn có thể đăng nhập vào hệ thống và sử dụng các dịch vụ của chúng tôi.\n\n"
                            + "Nếu bạn có bất kỳ câu hỏi nào hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi:\n"
                            + "- Email hỗ trợ: %s\n"
                            + "- Hoặc liên hệ qua hotline:  \n\n"
                            + "Cảm ơn bạn đã sử dụng dịch vụ của LuminaBook.\n\n"
                            + "Trân trọng,\n"
                            + "Đội ngũ LuminaBook",
                    userName != null ? userName : "Quý khách", roleDisplayName, toEmail, roleDisplayName, senderEmail);

            requestBody.put("textContent", emailContent);
            requestBody.put("htmlContent", emailContent.replace("\n", "<br>"));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Send request
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(BREVO_API_URL, request, Map.class);

            if (response.getStatusCode() != HttpStatus.CREATED) {
                log.error("Failed to send account unlocked email via Brevo API. Status: {}", response.getStatusCode());
                throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
            }

        } catch (Exception e) {
            log.error(
                    "Failed to send account unlocked email via Brevo API to: {} - Error: {}", toEmail, e.getMessage(), e);
            // Don't throw exception here - account unlock should succeed even if email fails
            // Just log the error
        }
    }

    public void sendOrderConfirmationEmail(Order order) {
        if (order == null || order.getUser() == null || order.getUser().getEmail() == null) {
            return;
        }
        try {
            String toEmail = order.getUser().getEmail();
            String customerName = order.getUser().getFullName() != null
                    ? order.getUser().getFullName()
                    : "Quý khách";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN"));

            // Build items list for text
            StringBuilder itemsTextBuilder = new StringBuilder();
            // Build items list for HTML
            StringBuilder itemsHtmlBuilder = new StringBuilder();
            if (order.getItems() != null && !order.getItems().isEmpty()) {
                for (OrderItem item : order.getItems()) {
                    String name = item.getProduct() != null ? item.getProduct().getName() : "Sản phẩm";
                    String itemText = String.format("- %s x%d : %s\n", 
                            name, item.getQuantity(), currencyFormat.format(item.getFinalPrice()));
                    itemsTextBuilder.append(itemText);
                    
                    String itemHtml = String.format(
                            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee;'>%s</td>" +
                            "<td style='padding: 8px; border-bottom: 1px solid #eee; text-align: center;'>x%d</td>" +
                            "<td style='padding: 8px; border-bottom: 1px solid #eee; text-align: right;'>%s</td></tr>",
                            name, item.getQuantity(), currencyFormat.format(item.getFinalPrice()));
                    itemsHtmlBuilder.append(itemHtml);
                }
            } else {
                // Nếu không có items, vẫn gửi email nhưng với thông báo
                itemsTextBuilder.append("Không có sản phẩm trong đơn hàng.\n");
                itemsHtmlBuilder.append("<tr><td colspan='3' style='padding: 8px; text-align: center; color: #999;'>Không có sản phẩm trong đơn hàng.</td></tr>");
            }

            // Parse shipping address
            String shippingAddressText = order.getShippingAddress();
            if (shippingAddressText != null && shippingAddressText.startsWith("{")) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    com.fasterxml.jackson.databind.JsonNode jsonNode = mapper.readTree(shippingAddressText);
                    String name = jsonNode.path("name").asText("");
                    String phone = jsonNode.path("phone").asText("");
                    String address = jsonNode.path("address").asText("");
                    shippingAddressText = String.format("%s - %s\n%s", name, phone, address);
                } catch (Exception e) {
                    // Keep original if parsing fails
                }
            }

            // Payment method display name
            String paymentMethodDisplay = "Không xác định";
            if (order.getPaymentMethod() != null) {
                switch (order.getPaymentMethod().name()) {
                    case "MOMO":
                        paymentMethodDisplay = "Thanh toán qua MoMo";
                        break;
                    case "COD":
                        paymentMethodDisplay = "Thanh toán khi nhận hàng (COD)";
                        break;
                    default:
                        paymentMethodDisplay = order.getPaymentMethod().name();
                }
            }

            // Text content
            String textContent = String.format(
                    "Xin chào %s,\n\n"
                            + "Cảm ơn bạn đã đặt hàng tại LuminaBook!\n\n"
                            + "Đơn hàng %s của bạn đã được xác nhận thành công.\n\n"
                            + "THÔNG TIN ĐƠN HÀNG:\n"
                            + "Mã đơn hàng: %s\n"
                            + "Ngày đặt: %s\n"
                            + "Tổng tiền: %s\n"
                            + "Phí vận chuyển: %s\n"
                            + "Phương thức thanh toán: %s\n\n"
                            + "CHI TIẾT SẢN PHẨM:\n%s\n"
                            + "ĐỊA CHỈ GIAO HÀNG:\n%s\n\n"
                            + "Chúng tôi sẽ liên hệ với bạn khi đơn hàng được giao cho đơn vị vận chuyển.\n"
                            + "Bạn có thể theo dõi trạng thái đơn hàng tại: http://localhost:3000/customer-account/orders\n\n"
                            + "Trân trọng,\nĐội ngũ LuminaBook",
                    customerName,
                    order.getCode(),
                    order.getCode(),
                    order.getOrderDate() != null ? order.getOrderDate().toString() : "Hôm nay",
                    currencyFormat.format(order.getTotalAmount()),
                    currencyFormat.format(order.getShippingFee() != null ? order.getShippingFee() : 0),
                    paymentMethodDisplay,
                    itemsTextBuilder.toString(),
                    shippingAddressText != null ? shippingAddressText : "Chưa có địa chỉ");

            // HTML content
            String htmlContent = String.format(
                    "<!DOCTYPE html>" +
                    "<html><head><meta charset='UTF-8'><style>" +
                    "body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                    ".container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
                    ".header { background-color: #1A3C5A; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }" +
                    ".content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }" +
                    ".order-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }" +
                    ".order-info h3 { margin-top: 0; color: #1A3C5A; }" +
                    ".items-table { width: 100%%; border-collapse: collapse; margin: 15px 0; background-color: white; }" +
                    ".items-table th { background-color: #1A3C5A; color: white; padding: 10px; text-align: left; }" +
                    ".items-table td { padding: 8px; border-bottom: 1px solid #eee; }" +
                    ".total-row { font-weight: bold; font-size: 18px; color: #1A3C5A; }" +
                    ".footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }" +
                    "</style></head><body>" +
                    "<div class='container'>" +
                    "<div class='header'><h1>Xác nhận đơn hàng</h1></div>" +
                    "<div class='content'>" +
                    "<p>Xin chào <strong>%s</strong>,</p>" +
                    "<p>Cảm ơn bạn đã đặt hàng tại <strong>LuminaBook</strong>!</p>" +
                    "<div class='order-info'>" +
                    "<h3>Thông tin đơn hàng</h3>" +
                    "<p><strong>Mã đơn hàng:</strong> %s</p>" +
                    "<p><strong>Ngày đặt:</strong> %s</p>" +
                    "<p><strong>Phương thức thanh toán:</strong> %s</p>" +
                    "</div>" +
                    "<h3>Chi tiết sản phẩm</h3>" +
                    "<table class='items-table'>" +
                    "<thead><tr><th>Sản phẩm</th><th style='text-align: center;'>Số lượng</th><th style='text-align: right;'>Thành tiền</th></tr></thead>" +
                    "<tbody>%s</tbody>" +
                    "<tfoot>" +
                    "<tr><td colspan='2' style='text-align: right; padding-top: 10px;'><strong>Phí vận chuyển:</strong></td>" +
                    "<td style='text-align: right; padding-top: 10px;'>%s</td></tr>" +
                    "<tr class='total-row'><td colspan='2' style='text-align: right; padding-top: 10px;'><strong>Tổng cộng:</strong></td>" +
                    "<td style='text-align: right; padding-top: 10px;'>%s</td></tr>" +
                    "</tfoot></table>" +
                    "<div class='order-info'>" +
                    "<h3>Địa chỉ giao hàng</h3>" +
                    "<p style='white-space: pre-line;'>%s</p>" +
                    "</div>" +
                    "<p>Chúng tôi sẽ liên hệ với bạn khi đơn hàng được giao cho đơn vị vận chuyển.</p>" +
                    "<p>Bạn có thể theo dõi trạng thái đơn hàng tại: " +
                    "<a href='http://localhost:3000/customer-account/orders'>Xem đơn hàng của tôi</a></p>" +
                    "</div>" +
                    "<div class='footer'>" +
                    "<p>Trân trọng,<br>Đội ngũ LuminaBook</p>" +
                    "</div></div></body></html>",
                    customerName,
                    order.getCode(),
                    order.getOrderDate() != null ? order.getOrderDate().toString() : "Hôm nay",
                    paymentMethodDisplay,
                    itemsHtmlBuilder.toString(),
                    currencyFormat.format(order.getShippingFee() != null ? order.getShippingFee() : 0),
                    currencyFormat.format(order.getTotalAmount()),
                    shippingAddressText != null ? shippingAddressText.replace("\n", "<br>") : "Chưa có địa chỉ");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("sender", Map.of("email", senderEmail, "name", "LuminaBook"));
            requestBody.put("to", new Object[] {Map.of("email", toEmail, "name", customerName)});
            requestBody.put("subject", "Xác nhận đơn hàng " + order.getCode() + " - LuminaBook");
            requestBody.put("textContent", textContent);
            requestBody.put("htmlContent", htmlContent);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(BREVO_API_URL, request, Map.class);

            if (response.getStatusCode() != HttpStatus.CREATED) {
                log.error("Failed to send order confirmation email. Status: {}, Response: {}", 
                        response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("Exception when sending order confirmation email: {}", e.getMessage(), e);
        }
    }

    /**
     * Gửi email cho khách khi CSKH đã xác nhận yêu cầu hoàn tiền / trả hàng.
     */
    public void sendReturnCsConfirmedEmail(Order order) {
        if (order == null || order.getUser() == null || order.getUser().getEmail() == null) {
            return;
        }
        try {
            String toEmail = order.getUser().getEmail();
            String customerName = order.getUser().getFullName() != null
                    ? order.getUser().getFullName()
                    : "Quý khách";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN"));

            String orderCode = order.getCode();
            String totalPaid = currencyFormat.format(order.getTotalAmount() != null ? order.getTotalAmount() : 0);
            String refundAmount = currencyFormat.format(order.getRefundAmount() != null ? order.getRefundAmount() : 0);

            String textContent = String.format(
                    "Xin chào %s,%n%n"
                            + "Yêu cầu trả hàng/hoàn tiền cho đơn hàng %s của bạn đã được bộ phận CSKH xác nhận là HỢP LỆ.%n%n"
                            + "THÔNG TIN ĐƠN HÀNG:%n"
                            + "- Mã đơn hàng: %s%n"
                            + "- Tổng tiền đã thanh toán: %s%n"
                            + "- Số tiền dự kiến hoàn lại (theo đề xuất hiện tại): %s%n%n"
                            + "Đơn hàng hiện đang được chuyển sang bộ phận kho để kiểm tra hàng hóa. "
                            + "Sau khi nhân viên kho xác nhận tình trạng sản phẩm, chúng tôi sẽ cập nhật kết quả hoàn tiền cho bạn.%n%n"
                            + "Bạn có thể theo dõi trạng thái đơn tại mục 'Hoàn tiền/ trả hàng' trong tài khoản của mình.%n%n"
                            + "Trân trọng,%nĐội ngũ LuminaBook",
                    customerName,
                    orderCode,
                    orderCode,
                    totalPaid,
                    refundAmount);

            String htmlContent = textContent.replace("\n", "<br>");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("sender", Map.of("email", senderEmail, "name", "LuminaBook CSKH"));
            requestBody.put("to", new Object[] {Map.of("email", toEmail, "name", customerName)});
            requestBody.put("subject", "CSKH đã xác nhận yêu cầu hoàn tiền cho đơn hàng " + orderCode);
            requestBody.put("textContent", textContent);
            requestBody.put("htmlContent", htmlContent);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(BREVO_API_URL, request, Map.class);

            if (response.getStatusCode() != HttpStatus.CREATED) {
                log.error(
                        "Failed to send return CS confirmed email. Status: {}, Response: {}",
                        response.getStatusCode(),
                        response.getBody());
            }
        } catch (Exception e) {
            log.error("Exception when sending return CS confirmed email: {}", e.getMessage(), e);
        }
    }

    /**
     * Gửi email cho khách khi NHÂN VIÊN kho đã kiểm tra hàng và xác định lỗi bên nào.
     */
    public void sendReturnStaffInspectionEmail(Order order) {
        if (order == null || order.getUser() == null || order.getUser().getEmail() == null) {
            return;
        }
        try {
            String toEmail = order.getUser().getEmail();
            String customerName = order.getUser().getFullName() != null
                    ? order.getUser().getFullName()
                    : "Quý khách";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN"));

            String orderCode = order.getCode();
            String totalPaid = currencyFormat.format(order.getTotalAmount() != null ? order.getTotalAmount() : 0);
            Double confirmed = order.getRefundConfirmedAmount() != null
                    ? order.getRefundConfirmedAmount()
                    : order.getRefundAmount();
            String refundAmount = currencyFormat.format(confirmed != null ? confirmed : 0);

            String staffNote = order.getStaffInspectionResult();
            String faultSide;
            String noteDisplay;
            if (staffNote != null && !staffNote.isBlank()) {
                String lower = staffNote.toLowerCase();
                if (lower.contains("lỗi khách")) {
                    faultSide = "Lỗi thuộc về KHÁCH HÀNG";
                } else if (lower.contains("lỗi cửa hàng") || lower.contains("lỗi shop")) {
                    faultSide = "Lỗi thuộc về CỬA HÀNG";
                } else {
                    faultSide = "Kết quả kiểm tra từ nhân viên kho";
                }
                noteDisplay = staffNote;
            } else {
                faultSide = "Kết quả kiểm tra từ nhân viên kho";
                noteDisplay = "Không có ghi chú chi tiết.";
            }

            String textContent = String.format(
                    "Xin chào %s,%n%n"
                            + "Yêu cầu trả hàng/hoàn tiền cho đơn hàng %s của bạn đã được NHÂN VIÊN kho kiểm tra và xác minh.%n%n"
                            + "KẾT QUẢ KIỂM TRA:%n"
                            + "- %s%n"
                            + "- Ghi chú: %s%n%n"
                            + "THÔNG TIN HOÀN TIỀN DỰ KIẾN:%n"
                            + "- Tổng tiền đã thanh toán: %s%n"
                            + "- Số tiền dự kiến hoàn lại: %s%n%n"
                            + "Admin sẽ tiến hành hoàn tiền theo kết quả trên trong thời gian sớm nhất.%n"
                            + "Bạn có thể theo dõi trạng thái đơn tại mục 'Hoàn tiền/ trả hàng' trong tài khoản của mình.%n%n"
                            + "Trân trọng,%nĐội ngũ LuminaBook",
                    customerName,
                    orderCode,
                    faultSide,
                    noteDisplay,
                    totalPaid,
                    refundAmount);

            String htmlContent = textContent.replace("\n", "<br>");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("sender", Map.of("email", senderEmail, "name", "LuminaBook Kho hàng"));
            requestBody.put("to", new Object[] {Map.of("email", toEmail, "name", customerName)});
            requestBody.put("subject", "Kết quả kiểm tra hàng trả về cho đơn hàng " + orderCode);
            requestBody.put("textContent", textContent);
            requestBody.put("htmlContent", htmlContent);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(BREVO_API_URL, request, Map.class);

            if (response.getStatusCode() != HttpStatus.CREATED) {
                log.error(
                        "Failed to send return staff inspection email. Status: {}, Response: {}",
                        response.getStatusCode(),
                        response.getBody());
            }
        } catch (Exception e) {
            log.error("Exception when sending return staff inspection email: {}", e.getMessage(), e);
        }
    }

    /**
     * Gửi email khi yêu cầu trả hàng/hoàn tiền bị từ chối (CSKH hoặc Nhân viên/ Admin).
     */
    public void sendReturnRejectedEmail(Order order) {
        if (order == null || order.getUser() == null || order.getUser().getEmail() == null) {
            return;
        }
        try {
            String toEmail = order.getUser().getEmail();
            String customerName = order.getUser().getFullName() != null
                    ? order.getUser().getFullName()
                    : "Quý khách";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            String orderCode = order.getCode();
            String rejectionReason = order.getRefundRejectionReason();
            String rejectionSource = order.getRefundRejectionSource();

            String sourceDisplay = "Hệ thống";
            if (rejectionSource != null) {
                String upper = rejectionSource.toUpperCase();
                if (upper.contains("CS")) {
                    sourceDisplay = "Bộ phận chăm sóc khách hàng";
                } else if (upper.contains("STAFF")) {
                    sourceDisplay = "Nhân viên kho";
                } else if (upper.contains("ADMIN")) {
                    sourceDisplay = "Admin";
                }
            }

            String textContent = String.format(
                    "Xin chào %s,%n%n"
                            + "Yêu cầu trả hàng/hoàn tiền cho đơn hàng %s của bạn đã bị TỪ CHỐI bởi %s.%n%n"
                            + "LÝ DO TỪ CHỐI:%n%s%n%n"
                            + "Nếu bạn cần làm rõ thêm, vui lòng liên hệ lại với bộ phận hỗ trợ của LuminaBook.%n%n"
                            + "Trân trọng,%nĐội ngũ LuminaBook",
                    customerName,
                    orderCode,
                    sourceDisplay,
                    rejectionReason != null ? rejectionReason : "Không có lý do chi tiết.");

            String htmlContent = textContent.replace("\n", "<br>");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("sender", Map.of("email", senderEmail, "name", "LuminaBook CSKH"));
            requestBody.put("to", new Object[] {Map.of("email", toEmail, "name", customerName)});
            requestBody.put("subject", "Thông báo từ chối yêu cầu hoàn tiền cho đơn hàng " + orderCode);
            requestBody.put("textContent", textContent);
            requestBody.put("htmlContent", htmlContent);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(BREVO_API_URL, request, Map.class);

            if (response.getStatusCode() != HttpStatus.CREATED) {
                log.error(
                        "Failed to send return rejected email. Status: {}, Response: {}",
                        response.getStatusCode(),
                        response.getBody());
            }
        } catch (Exception e) {
            log.error("Exception when sending return rejected email: {}", e.getMessage(), e);
        }
    }
}
