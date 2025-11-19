package com.lumina_book.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumina_book.backend.dto.request.ReviewCreationRequest;
import com.lumina_book.backend.dto.request.ReviewReplyRequest;
import com.lumina_book.backend.dto.response.ReviewResponse;
import com.lumina_book.backend.entity.Product;
import com.lumina_book.backend.entity.Review;
import com.lumina_book.backend.entity.User;
import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;
import com.lumina_book.backend.mapper.ReviewMapper;
import com.lumina_book.backend.mapper.UserMapper;
import com.lumina_book.backend.repository.ProductRepository;
import com.lumina_book.backend.repository.ReviewRepository;
import com.lumina_book.backend.repository.UserRepository;
import com.lumina_book.backend.util.SecurityUtil;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ReviewService {

    ReviewRepository reviewRepository;
    UserRepository userRepository;
    ProductRepository productRepository;
    ReviewMapper reviewMapper;
    private final UserMapper userMapper;

    public ReviewResponse getReviewById(String reviewId) {
        Review review =
                reviewRepository.findById(reviewId).orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_EXISTED));

        return reviewMapper.toReviewResponse(review);
    }

    public List<ReviewResponse> getReviewsByProduct(String productId) {
        List<Review> reviews = reviewRepository.findByProductId(productId);

        return reviews.stream().map(reviewMapper::toReviewResponse).toList();
    }

    public List<ReviewResponse> getMyReviews() {
        // Get current user from security context
        Authentication authentication = SecurityUtil.getAuthentication();
        String userId = authentication.getName();

        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        List<Review> reviews = reviewRepository.findByUserId(user.getId());

        return reviews.stream().map(reviewMapper::toReviewResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER_SUPPORT')")
    public List<ReviewResponse> getAllReviews() {
        List<Review> reviews = reviewRepository.findAll();

        return reviews.stream().map(reviewMapper::toReviewResponse).toList();
    }

    @Transactional
    public ReviewResponse createReview(ReviewCreationRequest request) {
        // Get current user from security context
        Authentication authentication = SecurityUtil.getAuthentication();
        String userId = authentication.getName();

        // Get user


        // Get product
        Product product = productRepository
                .findById(request.getProduct().getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        // Bắt buộc phải đăng nhập để đánh giá
        // Lấy user từ security context (bắt buộc)
        var context = SecurityContextHolder.getContext();
        String userEmail = context.getAuthentication().getName();

        // Get user by email (JWT token subject contains email, not userId)
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        log.info("Review created by user: {} (display name: {})",
                userEmail, request.getNameDisplay());

        // Create review entity using mapper
        Review review = reviewMapper.toReview(request);
        review.setNameDisplay(request.getNameDisplay()); // Tên hiển thị do người dùng nhập
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setCreatedAt(LocalDateTime.now());
        review.setUser(user); // Có thể null nếu không đăng nhập
        review.setProduct(product);

        Review savedReview = reviewRepository.save(review);
        String reviewerInfo = user != null ? user.getEmail() : (request.getNameDisplay() != null ? request.getNameDisplay() : "Anonymous");
        log.info("Review created with ID: {} by: {}", savedReview.getId(), reviewerInfo);

        return reviewMapper.toReviewResponse(savedReview);
    }

    @Transactional
    @PreAuthorize("hasRole('CUSTOMER_SUPPORT')")
    public ReviewResponse replyToReview(String reviewId, ReviewReplyRequest request) {
        // Find the review
        Review review =
                reviewRepository.findById(reviewId).orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_EXISTED));

        // Set reply and reply time
        review.setReply(request.getReply());
        review.setReplyAt(LocalDateTime.now());

        // Save the updated review
        Review savedReview = reviewRepository.save(review);
        log.info("Reply added to review: {} by customer support", reviewId);

        return reviewMapper.toReviewResponse(savedReview);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteReview(String reviewId) {
        Review review =
                reviewRepository.findById(reviewId).orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_EXISTED));

        reviewRepository.delete(review);
        log.info("Review deleted: {} by admin", reviewId);
    }
}
