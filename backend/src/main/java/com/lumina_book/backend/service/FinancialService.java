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

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumina_book.backend.dto.response.PaymentRevenue;
import com.lumina_book.backend.dto.response.RevenuePoint;
import com.lumina_book.backend.dto.response.RevenueSummary;
import com.lumina_book.backend.dto.response.FinancialSummary;
import com.lumina_book.backend.entity.FinancialRecord;
import com.lumina_book.backend.entity.Order;
import com.lumina_book.backend.entity.Product;
import com.lumina_book.backend.enums.FinancialRecordType;
import com.lumina_book.backend.enums.PaymentMethod;
import com.lumina_book.backend.enums.PaymentStatus;
import com.lumina_book.backend.repository.FinancialRecordRepository;
import com.lumina_book.backend.repository.OrderRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

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

    // Tổng hợp báo cáo doanh thu: tổng doanh thu, tổng đơn hàng, giá trị trung bình
    // Tổng doanh thu = tổng giá trị các sách bán ra (OrderItem.finalPrice), không bao gồm shipping fee
    public RevenueSummary revenueSummary(LocalDate start, LocalDate end) {
        LocalDateTime[] range = toDateTimeRange(start, end);
        
        // Lấy tất cả các đơn hàng trong khoảng thời gian (đã load items qua EntityGraph)
        List<Order> allOrders = orderRepository.findByOrderDateTimeBetween(range[0], range[1]);
        
        // Lọc các đơn hàng đã thanh toán thành công
        List<Order> paidOrders = allOrders.stream()
                .filter(order -> order.getPaymentStatus() == PaymentStatus.PAID
                        && Boolean.TRUE.equals(order.getPaid())
                        && order.getItems() != null
                        && !order.getItems().isEmpty())
                .toList();

        // Tính tổng doanh thu = sum của tất cả OrderItem.finalPrice (chỉ giá sách, không có shipping fee)
        double totalRevenue = paidOrders.stream()
                .flatMap(order -> order.getItems().stream())
                .filter(item -> item.getFinalPrice() != null && item.getFinalPrice() > 0)
                .mapToDouble(item -> item.getFinalPrice())
                .sum();

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

    // Tổng hợp tài chính: thu, chi, lợi nhuận
    // Tổng thu = tổng giá trị các sách bán ra (OrderItem.finalPrice), không bao gồm shipping fee
    // Lợi nhuận = Tổng thu - Giá vốn hàng bán - Tổng chi (hoàn tiền, bồi thường)
    public FinancialSummary summary(LocalDate start, LocalDate end) {
        LocalDateTime[] range = toDateTimeRange(start, end);
        
        // Lấy tất cả các đơn hàng trong khoảng thời gian 
        List<Order> allOrders = orderRepository.findByOrderDateTimeBetween(range[0], range[1]);
        
        // Lọc các đơn hàng đã thanh toán thành công
        List<Order> paidOrders = allOrders.stream()
                .filter(order -> order.getPaymentStatus() == PaymentStatus.PAID
                        && Boolean.TRUE.equals(order.getPaid())
                        && order.getItems() != null
                        && !order.getItems().isEmpty())
                .toList();

        // Tổng thu = sum của tất cả OrderItem.finalPrice (chỉ giá sách, không có shipping fee)
        double income = paidOrders.stream()
                .flatMap(order -> order.getItems().stream())
                .filter(item -> item.getFinalPrice() != null && item.getFinalPrice() > 0)
                .mapToDouble(item -> item.getFinalPrice())
                .sum();

        // Giá vốn hàng bán = sum của (purchasePrice * quantity) cho tất cả OrderItem
        double costOfGoodsSold = paidOrders.stream()
                .flatMap(order -> order.getItems().stream())
                .filter(item -> item.getProduct() != null 
                        && item.getProduct().getPurchasePrice() != null
                        && item.getQuantity() != null
                        && item.getQuantity() > 0)
                .mapToDouble(item -> {
                    double purchasePrice = item.getProduct().getPurchasePrice();
                    int quantity = item.getQuantity();
                    return purchasePrice * quantity;
                })
                .sum();

        // Chi phí: tính từ FinancialRecord (hoàn tiền, bồi thường, chi phí khác)
        List<FinancialRecord> records = financialRecordRepository.findByOccurredAtBetween(range[0], range[1]);
        double expense = records.stream()
                .filter(fr -> fr.getAmount() != null && fr.getAmount() < 0)
                .mapToDouble(fr -> -fr.getAmount())
                .sum();

        // Tổng chi = Giá vốn hàng bán + Chi phí khác (hoàn tiền, bồi thường)
        double totalExpense = costOfGoodsSold + expense;

        // Lợi nhuận = Tổng thu - Tổng chi
        double profit = income - totalExpense;

        return FinancialSummary.builder()
                .totalIncome(income)
                .totalExpense(totalExpense)
                .profit(profit)
                .build();
    }
}
