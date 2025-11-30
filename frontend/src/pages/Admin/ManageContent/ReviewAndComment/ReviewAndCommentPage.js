import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ReviewAndCommentPage.module.scss';
import SearchAndSort from '../../../../components/Common/SearchAndSort';
import { formatDateTime } from '../../../../services/utils';
import { useNotification } from '../../../../components/Common/Notification';
import { getStoredToken, getAllReviews, deleteReview } from '../../../../services';

const cx = classNames.bind(styles);

const STATUS_FILTERS = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'with-reply', label: 'Đã phản hồi' },
    { value: 'no-reply', label: 'Chưa phản hồi' },
];

function formatDateOnly(dateTime) {
    if (!dateTime) return '';
    const formatted = formatDateTime(dateTime);
    if (!formatted) return '';
    const [date] = formatted.split(' ');
    return date || formatted;
}

function renderStars(rating = 0) {
    const stars = [];
    for (let i = 1; i <= 5; i += 1) {
        stars.push(
            <span key={i} className={cx('star', { filled: i <= rating })}>
                ★
            </span>,
        );
    }
    return stars;
}

function renderStarsText(rating = 0) {
    const filled = '★'.repeat(Math.min(Math.max(rating, 0), 5));
    const emptyCount = 5 - filled.length;
    return `${filled}${'☆'.repeat(emptyCount >= 0 ? emptyCount : 0)}`;
}

export default function ReviewAndCommentPage() {
    const { success: notifySuccess, error: notifyError } = useNotification();

    const [reviews, setReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedReview, setSelectedReview] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [reviewPendingDeletion, setReviewPendingDeletion] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch real reviews from backend
    useEffect(() => {
        const fetchReviews = async () => {
            setLoading(true);
            try {
                const token = getStoredToken();
                if (!token) {
                    setReviews([]);
                    setFilteredReviews([]);
                    setLoading(false);
                    return;
                }

                const all = await getAllReviews(token);
                const mapped = (all || []).map((item) => ({
                    id: item.id,
                    productName: item.productName,
                    productId: item.productId,
                    customerName: item.userName || item.nameDisplay || 'Khách hàng',
                    rating: item.rating || 0,
                    comment: item.comment || '',
                    reply: item.reply || '',
                    createdAt: item.createdAt,
                    replyAt: item.replyAt,
                    createdDate: formatDateOnly(item.createdAt),
                }));

                setReviews(mapped);
                setFilteredReviews(mapped);
            } catch (err) {
                console.error('Error loading reviews:', err);
                notifyError('Không thể tải danh sách đánh giá. Vui lòng thử lại sau.');
                setReviews([]);
                setFilteredReviews([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [notifyError]);

    useEffect(() => {
        let filtered = [...reviews];

        if (searchTerm) {
            const keyword = searchTerm.toLowerCase();
            filtered = filtered.filter((review) => {
                return (
                    review.productName.toLowerCase().includes(keyword) ||
                    review.customerName.toLowerCase().includes(keyword) ||
                    review.comment.toLowerCase().includes(keyword)
                );
            });
        }

        if (dateFilter) {
            filtered = filtered.filter((review) => {
                if (!review.createdAt) return false;
                const filterDate = new Date(dateFilter);
                const reviewDate = new Date(review.createdAt);
                return (
                    filterDate.getFullYear() === reviewDate.getFullYear() &&
                    filterDate.getMonth() === reviewDate.getMonth() &&
                    filterDate.getDate() === reviewDate.getDate()
                );
            });
        }

        if (statusFilter === 'with-reply') {
            filtered = filtered.filter((review) => review.reply && review.reply.trim().length > 0);
        } else if (statusFilter === 'no-reply') {
            filtered = filtered.filter((review) => !review.reply || review.reply.trim().length === 0);
        }

        setFilteredReviews(filtered);
    }, [reviews, searchTerm, dateFilter, statusFilter]);

    const handleSearchClick = () => {
        // Filtering handled via useEffect
    };

    const handleOpenDetail = (review) => {
        setSelectedReview(review);
        setShowDetailModal(true);
    };

    const handleDeleteRequest = (review) => {
        setReviewPendingDeletion(review);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!reviewPendingDeletion) return;
        setIsDeleting(true);
        try {
            const token = getStoredToken();
            if (!token) {
                notifyError('Vui lòng đăng nhập lại để xóa đánh giá.');
                setIsDeleting(false);
                return;
            }

            // Gọi API xóa review thật
            await deleteReview(reviewPendingDeletion.id, token);

            // Cập nhật lại danh sách trên FE
            setReviews((prev) => prev.filter((review) => review.id !== reviewPendingDeletion.id));
            setShowDeleteModal(false);
            setReviewPendingDeletion(null);
            notifySuccess('Đã xóa đánh giá thành công.');
        } catch (err) {
            console.error('Error deleting review:', err);
            notifyError('Không thể xóa đánh giá. Vui lòng thử lại.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className={cx('review-page')}>
                <div className={cx('loading-state')}>Đang tải danh sách đánh giá...</div>
            </div>
        );
    }

    return (
        <div className={cx('review-page')}>
            <div className={cx('tabs-placeholder')} />
            <SearchAndSort
                searchPlaceholder="Tìm kiếm theo tiêu đề,......"
                searchValue={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                onSearchClick={handleSearchClick}
                dateFilter={dateFilter}
                onDateChange={setDateFilter}
                dateLabel=""
                sortLabel="Sắp xếp:"
                sortOptions={STATUS_FILTERS}
                sortValue={statusFilter}
                onSortChange={(e) => setStatusFilter(e.target.value)}
            />

            <div className={cx('table-wrapper')}>
                <h2 className={cx('table-title')}>Danh sách đánh giá và bình luận</h2>

                {filteredReviews.length === 0 ? (
                    <div className={cx('empty-state')}>
                        <p>Không tìm thấy đánh giá nào phù hợp.</p>
                    </div>
                ) : (
                    <table className={cx('reviews-table')}>
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Khách hàng</th>
                                <th>Số sao</th>
                                <th>Bình luận &amp; phản hồi</th>
                                <th>Ngày</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReviews.map((review, index) => (
                                <tr key={review.id} className={index % 2 === 1 ? cx('odd-row') : ''}>
                                    <td className={cx('product-cell')} data-label="Sản phẩm">
                                        {review.productName}
                                    </td>
                                    <td data-label="Khách hàng">{review.customerName}</td>
                                    <td data-label="Số sao">
                                        <div className={cx('stars')}>{renderStars(review.rating)}</div>
                                    </td>
                                    <td data-label="Bình luận & phản hồi">
                                        <div className={cx('comment-block')}>
                                            <p className={cx('comment-text')}>"{review.comment}"</p>
                                            {review.reply && review.reply.trim().length > 0 ? (
                                                <div className={cx('reply-block')}>
                                                    <span className={cx('reply-badge')}>⚠ CSKH:</span>
                                                    <p className={cx('reply-text')}>{review.reply}</p>
                                                </div>
                                            ) : (
                                                <div className={cx('no-reply')}>Chưa có phản hồi</div>
                                            )}
                                        </div>
                                    </td>
                                    <td data-label="Ngày">{review.createdDate || '-'}</td>
                                    <td data-label="Thao tác">
                                        <div className={cx('action-buttons')}>
                                            <button
                                                type="button"
                                                className={cx('action-btn', 'view')}
                                                onClick={() => handleOpenDetail(review)}
                                            >
                                                Xem
                                            </button>
                                            <button
                                                type="button"
                                                className={cx('action-btn', 'delete')}
                                                onClick={() => handleDeleteRequest(review)}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showDetailModal && selectedReview && (
                <div className={cx('modal-overlay')} onClick={() => setShowDetailModal(false)}>
                    <div className={cx('modal', 'detail-modal')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('modal-body')}>
                            <h3 className={cx('detail-title')}>Chi tiết đánh giá &amp; bình luận</h3>
                            <div className={cx('detail-row')}>
                                <span className={cx('detail-label')}>Sản phẩm:</span>
                                <span className={cx('detail-value')}>{selectedReview.productName}</span>
                            </div>
                            <div className={cx('detail-row')}>
                                <span className={cx('detail-label')}>Khách hàng:</span>
                                <span className={cx('detail-value')}>{selectedReview.customerName}</span>
                            </div>
                            <div className={cx('detail-row')}>
                                <span className={cx('detail-label')}>Số sao:</span>
                                <span className={cx('detail-value', 'detail-stars')}>
                                    {renderStarsText(selectedReview.rating)}
                                </span>
                            </div>
                            <div className={cx('detail-group')}>
                                <span className={cx('detail-label')}>Bình luận:</span>
                                <p className={cx('detail-text')}>
                                    {selectedReview.comment || 'Không có nội dung.'}
                                </p>
                            </div>
                            <div className={cx('detail-group')}>
                                <span className={cx('detail-label')}>Phản hồi CSKH:</span>
                                <p className={cx('detail-text')}>
                                    {selectedReview.reply && selectedReview.reply.trim().length > 0
                                        ? selectedReview.reply
                                        : 'Chưa có phản hồi'}
                                </p>
                            </div>
                            <div className={cx('detail-row')}>
                                <span className={cx('detail-label')}>Ngày đánh giá:</span>
                                <span className={cx('detail-value')}>{selectedReview.createdDate || '-'}</span>
                            </div>
                            {selectedReview.replyAt && (
                                <div className={cx('detail-row')}>
                                    <span className={cx('detail-label')}>Ngày phản hồi:</span>
                                    <span className={cx('detail-value')}>
                                        {formatDateOnly(selectedReview.replyAt)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className={cx('modal-footer')}>
                            <button
                                type="button"
                                className={cx('modal-btn', 'primary')}
                                onClick={() => setShowDetailModal(false)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && reviewPendingDeletion && (
                <div className={cx('modal-overlay')} onClick={() => setShowDeleteModal(false)}>
                    <div className={cx('modal', 'delete')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('modal-header')}>
                            <h3 className={cx('modal-title')}>Xóa đánh giá</h3>
                            <button
                                type="button"
                                className={cx('modal-close')}
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                ×
                            </button>
                        </div>
                        <div className={cx('modal-body')}>
                            <p className={cx('modal-text')}>
                                Bạn có chắc chắn muốn xóa đánh giá của{' '}
                                <strong>{reviewPendingDeletion.customerName}</strong> cho sản phẩm{' '}
                                <strong>{reviewPendingDeletion.productName}</strong> không?
                            </p>
                            <p className={cx('modal-text')}>Hành động này không thể hoàn tác.</p>
                        </div>
                        <div className={cx('modal-actions')}>
                            <button
                                type="button"
                                className={cx('modal-btn', 'cancel')}
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className={cx('modal-btn', 'danger')}
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

