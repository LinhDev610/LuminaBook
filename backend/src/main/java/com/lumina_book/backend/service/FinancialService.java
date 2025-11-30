package com.lumina_book.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.WeekFields;
import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumina_book.backend.dto.response.PaymentRevenue;
import com.lumina_book.backend.dto.response.ProductRevenue;
import com.lumina_book.backend.dto.response.RevenuePoint;
import com.lumina_book.backend.dto.response.RevenueSummary;
import com.lumina_book.backend.dto.response.FinancialSummary;
import com.lumina_book.backend.entity.FinancialRecord;
import com.lumina_book.backend.entity.Order;
import com.lumina_book.backend.entity.OrderItem;
import com.lumina_book.backend.entity.Product;
import com.lumina_book.backend.enums.FinancialRecordType;
import com.lumina_book.backend.enums.OrderStatus;
import com.lumina_book.backend.enums.PaymentMethod;
import com.lumina_book.backend.enums.PaymentStatus;
import com.lumina_book.backend.repository.FinancialRecordRepository;
import com.lumina_book.backend.repository.OrderRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FinancialService {

    FinancialRecordRepository financialRecordRepository;
    OrderRepository orderRepository;

    // Chuyển đổi LocalDate thành LocalDateTime range (start of day đến end of day).
    private LocalDateTime[] toDateTimeRange(LocalDate start, LocalDate end) {
        return new LocalDateTime[] {
            start.atStartOfDay(),
            end.atTime(LocalTime.MAX)
        };
    }

    // Lọc các đơn hàng đã thanh toán thành công trong khoảng thời gian
    private List<Order> getPaidOrdersInRange(LocalDateTime start, LocalDateTime end) {
        List<Order> allOrders = orderRepository.findByOrderDateTimeBetween(start, end);
        return allOrders.stream()
                .filter(order -> order.getPaymentStatus() == PaymentStatus.PAID
                        && Boolean.TRUE.equals(order.getPaid())
                        && order.getItems() != null
                        && !order.getItems().isEmpty())
                .toList();
    }

    // Tính tổng doanh thu từ danh sách đơn hàng đã thanh toán
    private double calculateTotalRevenue(List<Order> paidOrders) {
        return paidOrders.stream()
                .flatMap(order -> order.getItems().stream())
                .filter(item -> item.getFinalPrice() != null && item.getFinalPrice() > 0)
                .mapToDouble(item -> item.getFinalPrice())
                .sum();
    }

    // Kiểm tra xem đã ghi nhận doanh thu cho order này chưa
    public boolean hasRecordedRevenue(String orderId) {
        return financialRecordRepository.existsByOrderIdAndRecordType(
                orderId, FinancialRecordType.ORDER_PAYMENT);
    }

    @Transactional
    public void recordRevenue(Order order, Product product, double amount, PaymentMethod method) {
        FinancialRecord rec = FinancialRecord.builder()
                .order(order)
                .product(product)
                .amount(amount)
                .paymentMethod(method)
                .recordType(FinancialRecordType.ORDER_PAYMENT)
                .occurredAt(LocalDateTime.now())
                .build();
        financialRecordRepository.save(rec);
    }

        // r[0] = year
        // r[1] = month
        // r[2] = day
        // r[3] = hour
        // r[4] = orderId
        // r[5] = orderTotal

    // Tính doanh thu theo đơn hàng theo timeMode
    public List<RevenuePoint> revenueByDay(LocalDate start, LocalDate end, String timeMode) {
        LocalDateTime[] range = toDateTimeRange(start, end);
        
        // Day mode: group theo giờ
        if ("day".equals(timeMode)) {
            List<Object[]> orderRevenueData = financialRecordRepository.revenueByHourGroupedByOrder(
                    FinancialRecordType.ORDER_PAYMENT, range[0], range[1]);

            // Aggregate theo giờ (mỗi đơn hàng chỉ được tính 1 lần)
            Map<LocalDateTime, Double> revenueByHour = orderRevenueData.stream()
                    .collect(Collectors.groupingBy(
                            r -> {
                                int year = ((Number) r[0]).intValue();
                                int month = ((Number) r[1]).intValue();
                                int day = ((Number) r[2]).intValue();
                                int hour = ((Number) r[3]).intValue();
                                return LocalDateTime.of(year, month, day, hour, 0);
                            },
                            Collectors.summingDouble(r -> ((Number) r[5]).doubleValue())
                    ));

            return revenueByHour.entrySet().stream()
                    .map(entry -> new RevenuePoint(entry.getKey(), entry.getValue()))
                    .sorted((a, b) -> {
                        if (a.getDateTime() != null && b.getDateTime() != null) {
                            return a.getDateTime().compareTo(b.getDateTime());
                        }
                        return a.getDate().compareTo(b.getDate());
                    })
                    .toList();
        }
        
        // Year mode: group theo tháng
        if ("year".equals(timeMode)) {
            List<Object[]> orderRevenueData = financialRecordRepository.revenueByMonthGroupedByOrder(
                    FinancialRecordType.ORDER_PAYMENT, range[0], range[1]);

            // Aggregate theo tháng (mỗi đơn hàng chỉ được tính 1 lần)
            Map<LocalDate, Double> revenueByMonth = orderRevenueData.stream()
                    .collect(Collectors.groupingBy(
                            r -> {
                                int year = ((Number) r[0]).intValue();
                                int month = ((Number) r[1]).intValue();
                                return LocalDate.of(year, month, 1); // Ngày 1 của tháng
                            },
                            Collectors.summingDouble(r -> ((Number) r[3]).doubleValue())
                    ));
            

            // Fill tất cả các tháng trong năm (từ tháng 1 đến tháng 12)
            // Dùng năm từ end date (năm hiện tại) thay vì start date
            int year = end.getYear();
            List<RevenuePoint> result = new ArrayList<>();
            
            // Tạo tất cả các tháng từ 1 đến 12
            for (int month = 1; month <= 12; month++) {
                LocalDate monthStart = LocalDate.of(year, month, 1);
                // Map key đã là LocalDate.of(year, month, 1), nên dùng getOrDefault trực tiếp
                Double revenue = revenueByMonth.getOrDefault(monthStart, 0.0);
                result.add(new RevenuePoint(monthStart, revenue));
            }

            return result.stream()
                    .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                    .toList();
        }
        
        // Month mode: group theo tuần
        if ("month".equals(timeMode)) {
            List<Object[]> orderRevenueData = financialRecordRepository.revenueByDayGroupedByOrder(
                    FinancialRecordType.ORDER_PAYMENT, range[0], range[1]);

            // Aggregate theo tuần (mỗi đơn hàng chỉ được tính 1 lần)
            Map<LocalDate, Double> revenueByWeek = orderRevenueData.stream()
                    .collect(Collectors.groupingBy(
                            r -> {
                                int year = ((Number) r[0]).intValue();
                                int month = ((Number) r[1]).intValue();
                                int day = ((Number) r[2]).intValue();
                                LocalDate date = LocalDate.of(year, month, day);
                                // Lấy ngày đầu tuần (thứ 2) của tuần đó
                                int dayOfWeek = date.getDayOfWeek().getValue(); // 1 = Monday, 7 = Sunday
                                int daysToMonday = (dayOfWeek == 1) ? 0 : (dayOfWeek == 7) ? 6 : dayOfWeek - 1;
                                return date.minusDays(daysToMonday);
                            },
                            Collectors.summingDouble(r -> ((Number) r[4]).doubleValue())
                    ));

            // Fill tất cả các tuần trong tháng (kể cả tuần không có data)
            LocalDate monthStart = start;
            LocalDate monthEnd = end;
            List<RevenuePoint> result = new ArrayList<>();
            
            // Tìm tuần đầu tiên của tháng (có thể là thứ 2 của tuần chứa ngày 1)
            LocalDate firstDayOfMonth = monthStart;
            int firstDayOfWeek = firstDayOfMonth.getDayOfWeek().getValue();
            int daysToFirstMonday = (firstDayOfWeek == 1) ? 0 : (firstDayOfWeek == 7) ? 6 : firstDayOfWeek - 1;
            LocalDate firstWeekStart = firstDayOfMonth.minusDays(daysToFirstMonday);
            
            // Tìm tuần cuối cùng của tháng
            LocalDate lastDayOfMonth = monthEnd;
            int lastDayOfWeek = lastDayOfMonth.getDayOfWeek().getValue();
            int daysToLastMonday = (lastDayOfWeek == 1) ? 0 : (lastDayOfWeek == 7) ? 6 : lastDayOfWeek - 1;
            LocalDate lastWeekStart = lastDayOfMonth.minusDays(daysToLastMonday);
            
            // Tạo tất cả các tuần từ tuần đầu đến tuần cuối
            LocalDate currentWeekStart = firstWeekStart;
            while (!currentWeekStart.isAfter(lastWeekStart)) {
                Double revenue = revenueByWeek.getOrDefault(currentWeekStart, 0.0);
                result.add(new RevenuePoint(currentWeekStart, revenue));
                currentWeekStart = currentWeekStart.plusWeeks(1);
            }

            return result.stream()
                    .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                .toList();
    }

        // Week mode: group theo ngày
        List<Object[]> orderRevenueData = financialRecordRepository.revenueByDayGroupedByOrder(
                FinancialRecordType.ORDER_PAYMENT, range[0], range[1]);

        // Aggregate theo date (mỗi đơn hàng chỉ được tính 1 lần)
        Map<LocalDate, Double> revenueByDate = orderRevenueData.stream()
                .collect(Collectors.groupingBy(
                        r -> {
                            // r[0] = year, r[1] = month, r[2] = day
                            int year = ((Number) r[0]).intValue();
                            int month = ((Number) r[1]).intValue();
                            int day = ((Number) r[2]).intValue();
                            return LocalDate.of(year, month, day);
                        },
                        Collectors.summingDouble(r -> ((Number) r[4]).doubleValue())
                ));

        // Fill tất cả các ngày trong tuần (từ thứ 2 đến Chủ nhật)
        LocalDate weekStart = start; // start đã là thứ 2
        LocalDate weekEnd = end; // end đã là Chủ nhật
        List<RevenuePoint> result = new ArrayList<>();
        
        // Tạo tất cả các ngày từ thứ 2 đến Chủ nhật
        LocalDate currentDate = weekStart;
        while (!currentDate.isAfter(weekEnd)) {
            Double revenue = revenueByDate.getOrDefault(currentDate, 0.0);
            result.add(new RevenuePoint(currentDate, revenue));
            currentDate = currentDate.plusDays(1);
        }

        return result.stream()
                .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                .toList();
    }

    // Tính doanh thu theo phương thức thanh toán
    public List<PaymentRevenue> revenueByPayment(LocalDate start, LocalDate end) {
        LocalDateTime[] range = toDateTimeRange(start, end);
        return financialRecordRepository.revenueByPayment(FinancialRecordType.ORDER_PAYMENT, range[0], range[1])
                .stream()
                .map(r -> new PaymentRevenue((PaymentMethod) r[0], ((Number) r[1]).doubleValue()))
                .toList();
    }

    // Tổng doanh thu = tổng giá trị các sách bán ra (OrderItem.finalPrice), không bao gồm shipping fee
    public RevenueSummary revenueSummary(LocalDate start, LocalDate end) {
        LocalDateTime[] range = toDateTimeRange(start, end);
        
        // Lọc các đơn hàng đã thanh toán thành công
        List<Order> paidOrders = getPaidOrdersInRange(range[0], range[1]);

        // Tính tổng doanh thu = sum của tất cả OrderItem.finalPrice (chỉ giá sách, không có shipping fee)
        double totalRevenue = calculateTotalRevenue(paidOrders);

        // Tổng đơn hàng
        long totalOrders = paidOrders.size();

        // Giá trị trung bình mỗi đơn hàng (chỉ tính giá sách, không có shipping fee)
        double averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0.0;

        return RevenueSummary.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .averageOrderValue(averageOrderValue)
                .build();
    }

    /**
     * Tính toán báo cáo tài chính tổng hợp
     * 
     * Công thức:
     * - Tổng thu = Tổng doanh thu từ các đơn hàng đã thanh toán (OrderItem.finalPrice) - bỏ giá ship của đơn
     * - Tổng chi = Giá gốc sản phẩm + Chi phí phát sinh do hoàn hàng/hoàn tiền + Tiền ship đơn hoàn từ khách về (nếu lỗi do cửa hàng)
     *   - Giá gốc sản phẩm = sum của (purchasePrice × quantity) cho tất cả OrderItem
     *   - Chi phí phát sinh = sum của FinancialRecord có type là REFUND hoặc COMPENSATION
     *   - Tiền ship đơn hoàn = sum của refundSecondShippingFee/refundReturnFee của các đơn đã hoàn với lý do 'store'
     * - Lợi nhuận = Tổng thu - Tổng chi
     */
    public FinancialSummary summary(LocalDate start, LocalDate end) {
        LocalDateTime[] range = toDateTimeRange(start, end);
        
        // Lọc các đơn hàng đã thanh toán thành công
        List<Order> paidOrders = getPaidOrdersInRange(range[0], range[1]);

        // Tổng thu = sum của tất cả OrderItem.finalPrice (chỉ giá sách, không có shipping fee)
        double income = calculateTotalRevenue(paidOrders);

        AtomicInteger itemsWithoutPurchasePrice = new AtomicInteger(0);
        AtomicInteger totalItemsProcessed = new AtomicInteger(0);
        double costOfGoodsSold = paidOrders.stream()
                .flatMap(order -> order.getItems().stream())
                .filter(item -> {
                    totalItemsProcessed.incrementAndGet();
                    return item.getProduct() != null 
                            && item.getQuantity() != null
                            && item.getQuantity() > 0;
                })
                .mapToDouble(item -> {
                    // Nếu purchasePrice là null hoặc <= 0, tính = 0
                    Product product = item.getProduct();
                    if (product == null) {
                        log.warn("OrderItem has null product - Item ID: {}", item.getId());
                        return 0.0;
                    }
                    
                    Double purchasePrice = product.getPurchasePrice();
                    double price = (purchasePrice != null && purchasePrice > 0) ? purchasePrice : 0.0;
                    int quantity = item.getQuantity();
                    double cost = price * quantity;
                    
                    // Đếm số item không có purchasePrice để log warning sau
                    if (purchasePrice == null || purchasePrice <= 0) {
                        itemsWithoutPurchasePrice.incrementAndGet();
                        log.warn("Product {} (ID: {}) has no purchase price. Product fields - unitPrice: {}, price: {}, purchasePrice: {}", 
                                product.getName(), product.getId(), 
                                product.getUnitPrice(), product.getPrice(), product.getPurchasePrice());
                    }
                    
                    return cost;
                })
                .sum();

        // Chi phí phát sinh = sum của FinancialRecord có type là REFUND hoặc COMPENSATION
        List<FinancialRecord> records = financialRecordRepository.findByOccurredAtBetween(range[0], range[1]);
        double expense = records.stream()
                .filter(fr -> fr.getAmount() != null 
                        && (fr.getRecordType() == FinancialRecordType.REFUND 
                            || fr.getRecordType() == FinancialRecordType.COMPENSATION))
                .mapToDouble(fr -> Math.abs(fr.getAmount())) // Lấy giá trị tuyệt đối vì đây là chi phí
                .sum();

        // Tiền ship đơn hoàn từ khách về 
        List<Order> refundedOrders = orderRepository.findByOrderDateTimeBetween(range[0], range[1])
                .stream()
                .filter(order -> order.getStatus() == OrderStatus.REFUNDED
                        && "store".equalsIgnoreCase(order.getRefundReasonType())
                        && (order.getRefundSecondShippingFee() != null || order.getRefundReturnFee() != null))
                .toList();
        
        double returnShippingFee = refundedOrders.stream()
                .mapToDouble(order -> {
                    // Ưu tiên refundSecondShippingFee, nếu không có thì dùng refundReturnFee
                    if (order.getRefundSecondShippingFee() != null && order.getRefundSecondShippingFee() > 0) {
                        return order.getRefundSecondShippingFee();
                    }
                    return order.getRefundReturnFee() != null ? order.getRefundReturnFee() : 0.0;
                })
                .sum();

        // Tổng chi = Giá gốc sản phẩm + Chi phí phát sinh do hoàn hàng/hoàn tiền + Tiền ship đơn hoàn (nếu lỗi do cửa hàng)
        double totalExpense = costOfGoodsSold + expense + returnShippingFee;

        // Lợi nhuận = Tổng thu - Tổng chi
        double profit = income - totalExpense;

        return FinancialSummary.builder()
                .totalIncome(income)
                .totalExpense(totalExpense)
                .profit(profit)
                .build();
    }

    /**
     * Lấy top sản phẩm bán chạy theo doanh thu trong khoảng thời gian.
     * 
     * @param start Ngày bắt đầu
     * @param end Ngày kết thúc
     * @param limit Số lượng sản phẩm top (mặc định 10)
     * @return Danh sách ProductRevenue sắp xếp theo doanh thu giảm dần
     */
    public List<ProductRevenue> topProductsByRevenue(LocalDate start, LocalDate end, int limit) {
        LocalDateTime[] range = toDateTimeRange(start, end);
        
        // Lọc các đơn hàng đã thanh toán thành công
        List<Order> paidOrders = getPaidOrdersInRange(range[0], range[1]);

        if (paidOrders.isEmpty()) {
            log.debug("No paid orders found in date range");
            return List.of();
        }

        // Nhóm theo productId và tính tổng quantity và revenue
        // Lưu ý: OrderItem.finalPrice đã là tổng giá cho quantity (finalPrice = unitPrice * quantity)
        Map<String, ProductRevenue> productMap = paidOrders.stream()
                .flatMap(order -> order.getItems().stream())
                .filter(item -> isValidOrderItem(item))
                .collect(Collectors.groupingBy(
                        item -> item.getProduct().getId(),
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                this::buildProductRevenue
                        )
                ));
        
        // Sắp xếp theo doanh thu giảm dần và lấy top limit
        List<ProductRevenue> result = productMap.values().stream()
                .sorted((a, b) -> Double.compare(b.getTotal(), a.getTotal()))
                .limit(limit)
                .collect(Collectors.toList());
        
        if (!result.isEmpty()) {
            log.info("Top product: {} - quantity: {}, revenue: {}", 
                    result.get(0).getProductName(), result.get(0).getQuantity(), result.get(0).getTotal());
        }
        return result;
    }

    // Kiểm tra OrderItem có hợp lệ không (có product, finalPrice > 0, quantity > 0).
    private boolean isValidOrderItem(OrderItem item) {
        return item.getProduct() != null
                && item.getProduct().getId() != null
                && item.getProduct().getName() != null
                && item.getFinalPrice() != null
                && item.getFinalPrice() > 0
                && item.getQuantity() != null
                && item.getQuantity() > 0;
    }

    // Tính tổng quantity và revenue từ danh sách OrderItem của cùng một product.
    private ProductRevenue buildProductRevenue(List<OrderItem> items) {
        Product product = items.get(0).getProduct();
        long totalQuantity = items.stream()
                .mapToLong(OrderItem::getQuantity)
                .sum();
        // finalPrice đã là tổng cho quantity, chỉ cần sum lại
        double totalRevenue = items.stream()
                .mapToDouble(OrderItem::getFinalPrice)
                .sum();
        
        return ProductRevenue.builder()
                .productId(product.getId())
                .productName(product.getName())
                .quantity(totalQuantity)
                .total(totalRevenue)
                .build();
    }
}
