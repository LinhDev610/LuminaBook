import classNames from 'classnames/bind';
import styles from './AddProductPage.module.scss';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import backIcon from '../../../../../assets/icons/icon_back.png';

const cx = classNames.bind(styles);

export default function AddProductPage() {
    const navigate = useNavigate();
    const formRef = useRef(null);
    return (
        <div className={cx('wrap')}>
            <div className={cx('topbar')}>
                <button className={cx('backBtn')} onClick={() => navigate('/staff/products', { replace: true })}>
                    <img src={backIcon} alt="Quay lại" className={cx('backIcon')} />
                </button>
            </div>
            <div className={cx('card')}>
                <div className={cx('card-header')}>Thêm sản phẩm mới</div>
                <form ref={formRef} className={cx('form')}>
                    <div className={cx('row')}>
                        <label>Mã sản phẩm</label>
                        <input placeholder="VD: SP0001" />
                    </div>
                    <div className={cx('row')}>
                        <label>Tên sản phẩm</label>
                        <input placeholder="VD: Sách lập trình C++" />
                    </div>
                    <div className={cx('row')}>
                        <label>Tác giả / Nhà xuất bản</label>
                        <input placeholder="VD: Tô Năng / Vẹn B" />
                    </div>
                    <div className={cx('row')}>
                        <label>Giá niêm yết (VND)</label>
                        <input placeholder="VD: 150000" />
                    </div>
                    <div className={cx('grid2')}>
                        <div className={cx('row')}>
                            <label>Danh mục sách</label>
                            <select>
                                <option>--Chọn danh mục--</option>
                            </select>
                        </div>
                        <div className={cx('row')}>
                            <label>Thuế (%)</label>
                            <input placeholder="%" />
                        </div>
                    </div>
                    <div className={cx('row')}>
                        <label>Giá cuối cùng (đã gồm thuế)</label>
                        <input placeholder="Tự động tính" />
                    </div>
                    <div className={cx('row', 'dimension')}>
                        <label>Kích thước (cm) & Trọng lượng</label>
                        <div className={cx('grid4')}>
                            <input placeholder="Dài (cm)" />
                            <input placeholder="Rộng (cm)" />
                            <input placeholder="Cao (cm)" />
                            <input placeholder="Trọng lượng (g)" />
                        </div>
                        <div className={cx('example')}>Ví dụ kích thước: <strong>19.8 × 12.9 × 1.5 cm</strong></div>
                    </div>
                    <div className={cx('row')}>
                        <label>Ảnh sản phẩm</label>
                        <input type="file" />
                    </div>
                    <div className={cx('row')}>
                        <label>Mô tả sản phẩm</label>
                        <textarea rows={5} />
                    </div>
                    <div className={cx('grid2')}>
                        <div className={cx('row')}>
                            <label>Số lượng tồn kho</label>
                            <input />
                        </div>
                        <div className={cx('row')}>
                            <label>Trạng thái</label>
                            <select>
                                <option>Còn hàng</option>
                                <option>Hết hàng</option>
                            </select>
                        </div>
                    </div>
                    <div className={cx('actions')}>
                        <button type="button" className={cx('btn', 'muted')} onClick={() => formRef.current?.reset()}>Reset</button>
                        <button type="submit" className={cx('btn', 'primary')}>Gửi duyệt</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
