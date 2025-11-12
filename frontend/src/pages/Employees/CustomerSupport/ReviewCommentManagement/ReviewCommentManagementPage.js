import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ReviewCommentManagementPage.module.scss';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../../components/Common/Notification';

const cx = classNames.bind(styles);

const MOCK_REVIEWS = [
    {
        id: 'rv-001',
        customerName: 'Mai',
        date: '2025-10-05',
        comment: 'Sản phẩm tốt nhưng giao chậm.',
        reply: 'CSKH đã ghi nhận và sẽ cải thiện tốc độ giao hàng ạ.',
        rating: 4,
        status: 'answered',
    },
    {
        id: 'rv-002',
        customerName: 'Hùng',
        date: '2025-10-02',
        comment: 'Hộp bị móp nhẹ, cần hỗ trợ đổi.',
        reply: 'CSKH đang hướng dẫn quy trình đổi trả cho anh.',
        rating: 3,
        status: 'answered',
    },
    {
        id: 'rv-003',
        customerName: 'Quyên',
        date: '2025-10-01',
        comment: 'Màu sắc sách đẹp, nội dung hay nhưng giao hàng hơi trễ.',
        reply: '',
        rating: 5,
        status: 'pending',
    },
];

const ratingToStars = (rating = 0) => {
    const safe = Math.max(0, Math.min(5, rating));
    return `${'★'.repeat(safe)}${'☆'.repeat(5 - safe)}`;
};

export default function ReviewCommentManagementPage() {
    const navigate = useNavigate();
    const { success: notifySuccess, error: notifyError } = useNotification();

    const [reviews, setReviews] = useState(MOCK_REVIEWS);
    const [replyDrafts, setReplyDrafts] = useState(() =>
        MOCK_REVIEWS.reduce((acc, review) => {
            acc[review.id] = review.reply || '';
            return acc;
        }, {}),
    );

    const handleChangeReply = (id, value) => {
        setReplyDrafts((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSendReply = (id) => {
        const draft = replyDrafts[id] ? replyDrafts[id].trim() : '';
        if (!draft) {
            notifyError('Vui lòng nhập nội dung trả lời trước khi gửi.');
            return;
        }

        setReviews((prev) =>
            prev.map((review) =>
                review.id === id
                    ? {
                          ...review,
                          reply: draft,
                          status: 'answered',
                      }
                    : review,
            ),
        );
        notifySuccess('Đã gửi phản hồi tới khách hàng.');
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('topLine')} />
            <div className={cx('pageHeader')}>
                <h1 className={cx('pageTitle')}>Đánh giá và bình luận</h1>
                <button className={cx('dashboardBtn')} onClick={() => navigate('/customer-support')}>
                    ← Dashboard
                </button>
            </div>

            <div className={cx('contentWrapper')}>
                <div className={cx('contentCard')}>
                    <div className={cx('cardHeading')}>
                        <h2 className={cx('sectionTitle')}>Quản lý đánh giá &amp; bình luận</h2>
                        <p className={cx('sectionDesc')}>
                            Danh sách đánh giá và bình luận của khách hàng. Trả lời trực tiếp từ giao diện này.
                        </p>
                    </div>

                    <div className={cx('reviewsList')}>
                        {reviews.map((review) => (
                            <div key={review.id} className={cx('reviewItem')}>
                                <div className={cx('reviewHeader')}>
                                    <div className={cx('customerInfo')}>
                                        <span className={cx('customerName')}>{review.customerName}</span>
                                        <span className={cx('reviewDate')}>{review.date}</span>
                                    </div>
                                    <div className={cx('rating')}>{ratingToStars(review.rating)}</div>
                                </div>

                                <p className={cx('comment')}>{review.comment}</p>

                                {review.reply && <p className={cx('replyText')}>{review.reply}</p>}

                                <div className={cx('replyInputRow')}>
                                    <input
                                        type="text"
                                        className={cx('replyInput')}
                                        placeholder="Nhập trả lời..."
                                        value={replyDrafts[review.id] || ''}
                                        onChange={(e) => handleChangeReply(review.id, e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className={cx('replyButton')}
                                        onClick={() => handleSendReply(review.id)}
                                    >
                                        Trả lời
                                    </button>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

