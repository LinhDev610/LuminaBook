import classNames from 'classnames/bind';
import styles from './CustomerSupportMainPage.module.scss';
import { useNavigate } from 'react-router-dom';
import { CustomerSupportHeader } from '../../../../layouts/components/Header';

const cx = classNames.bind(styles);

export default function CustomerSupportMainPage() {
    const navigate = useNavigate();

    return (
        <div>
            <div className={cx('header-section')}>
                <CustomerSupportHeader />
            </div>
            <div className={cx('wrap')}>
                <div className={cx('card')} onClick={() => navigate('/customer-support/complaints')}>
                    <div className={cx('card-title')}>Quản lý khiếu nại</div>
                    <div className={cx('card-desc')}>
                        Quản lý các đơn khiếu nại và xử lý các đơn khiếu nại của khách hàng
                    </div>
                </div>

                <div className={cx('card')} onClick={() => navigate('/customer-support/reviews')}>
                    <div className={cx('card-title')}>Quản lý đánh giá và bình luận</div>
                    <div className={cx('card-desc')}>
                        Quản lý các bình luận, đánh giá của khách hàng
                    </div>
                </div>

                <div className={cx('card')} onClick={() => navigate('/customer-support/chat')}>
                    <div className={cx('card-title')}>Quản lý Chat</div>
                    <div className={cx('card-desc')}>
                        Trò chuyện và hỗ trợ khách hàng trực tuyến
                    </div>
                </div>

                <div className={cx('card', 'quick-actions')}>
                    <div className={cx('card-title')}>Tác vụ nhanh</div>
                    <div className={cx('actions')}>
                        <button className={cx('btn')} onClick={() => navigate('/customer-support/complaints')}>
                            Đơn khiếu nại
                        </button>
                        <button className={cx('btn')} onClick={() => navigate('/customer-support/reviews')}>
                            Bình luận
                        </button>
                        <button className={cx('btn')} onClick={() => navigate('/customer-support/chat')}>
                            Chat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

