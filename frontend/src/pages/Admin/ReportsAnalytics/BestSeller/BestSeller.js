import classNames from 'classnames/bind';
import styles from './BestSeller.module.scss';

const cx = classNames.bind(styles);

function BestSeller() {
    return (
        <div className={cx('card')}>
            <div className={cx('cardTitle')}>Top bán chạy</div>
            <div className={cx('cardSubtitle')}>Top sách theo doanh thu</div>

            <table className={cx('table')}>
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Tên sách</th>
                        <th>Số lượng (ước tính)</th>
                        <th>Doanh thu</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Danh sách top sản phẩm */}
                </tbody>
            </table>
            <div className={cx('helper')}>
                Số lượng là ước tính dựa trên đơn giá hiện tại, có thể chênh lệch nhẹ so với thực tế.
            </div>
        </div>
    );
}

export default BestSeller;
