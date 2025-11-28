package com.lumina_book.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lumina_book.backend.entity.Order;

public interface OrderRepository extends JpaRepository<Order, String> {

    /**
     * Tìm các đơn hàng theo email của user (subject của JWT).
     * Chỉ trả về đơn hàng đã thanh toán thành công hoặc đơn COD (không cần thanh toán trước).
     * Loại bỏ đơn hàng MoMo chưa thanh toán (paymentStatus = PENDING, FAILED, CANCELLED và paymentMethod = MOMO).
     */
    @EntityGraph(attributePaths = {"items", "items.product", "items.product.defaultMedia", "items.product.mediaList"})
    @Query("SELECT o FROM Order o WHERE o.user.email = :email " +
           "AND (o.paymentMethod != 'MOMO' OR o.paymentStatus = 'PAID') " +
           "ORDER BY o.orderDateTime DESC")
    List<Order> findByUserEmail(@Param("email") String email);

    /**
     * Tìm đơn hàng gắn với một giỏ hàng cụ thể.
     * Do mapping @OneToOne nên tối đa chỉ có 1 đơn cho mỗi cart.
     */
    @EntityGraph(attributePaths = {"items", "items.product", "items.product.defaultMedia", "items.product.mediaList"})
    Optional<Order> findByCartId(String cartId);

    @EntityGraph(attributePaths = {"items", "items.product", "items.product.defaultMedia", "items.product.mediaList"})
    Optional<Order> findByCode(String code);

    @Override
    @EntityGraph(attributePaths = {"items", "items.product", "items.product.defaultMedia", "items.product.mediaList"})
    Optional<Order> findById(String id);

    /**
     * Tìm các đơn hàng có status liên quan đến trả hàng/hoàn tiền.
     * Dành cho Customer Support để quản lý yêu cầu trả hàng.
     */
    @EntityGraph(attributePaths = {"items", "items.product", "items.product.defaultMedia", "items.product.mediaList", "user"})
    @Query("SELECT o FROM Order o WHERE o.status IN :statuses ORDER BY o.orderDateTime DESC")
    List<Order> findByStatusIn(@Param("statuses") List<com.lumina_book.backend.enums.OrderStatus> statuses);

    /**
     * Tìm đơn hàng MoMo pending (chưa thanh toán) của user trong vòng 30 phút gần đây.
     * Dùng để tránh tạo duplicate order khi user click nhiều lần.
     */
    @EntityGraph(attributePaths = {"items", "items.product", "items.product.defaultMedia", "items.product.mediaList"})
    @Query("SELECT o FROM Order o WHERE o.user.email = :email " +
           "AND o.paymentMethod = 'MOMO' " +
           "AND o.paymentStatus = 'PENDING' " +
           "AND o.orderDateTime >= :sinceTime " +
           "ORDER BY o.orderDateTime DESC")
    List<Order> findPendingMomoOrdersByUserSince(
            @Param("email") String email,
            @Param("sinceTime") java.time.LocalDateTime sinceTime);
}
