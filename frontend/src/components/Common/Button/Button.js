import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { Link } from 'react-router-dom';
import styles from './Button.module.scss';

const cx = classNames.bind(styles);

function Button({
    to, // đường dẫn nội bộ (→ dùng <Link>)
    href, // đường dẫn ngoài (→ dùng <a>)
    primary = false, // nút chính (màu nổi bật)
    outline = false, // nút viền
    text = false, // nút dạng text (không viền)
    rounded = false, // bo tròn góc
    disabled = false, // vô hiệu hoá nút
    small = false, // kích thước nhỏ
    large = false, // kích thước lớn
    children, // nội dung trong nút (text/icon)
    className, // class CSS tùy chỉnh
    leftIcon, // icon bên trái
    rightIcon, // icon bên phải
    onClick, // hàm xử lý khi click
    ...passProps // các props khác (vd: type="submit")
}) {
    let Comp = 'button';
    const props = {
        onClick,
        ...passProps,
    };

    // Remove event listener when btn is disabled
    if (disabled) {
        Object.keys(props).forEach((key) => {
            if (key.startsWith('on') && typeof props[key] === 'function') {
                delete props[key];
            }
        });
    }

    if (to) {
        props.to = to;
        Comp = Link;
    } else if (href) {
        props.href = href;
        Comp = 'a';
    }

    // Ensure native button does not accidentally submit forms unless explicitly set
    if (Comp === 'button' && props.type === undefined) {
        props.type = 'button';
    }

    const boundClasses = cx('wrapper', {
        primary,
        outline,
        text,
        disabled,
        rounded,
        small,
        large,
    });
    const classes = className ? `${boundClasses} ${className}` : boundClasses;

    return (
        <Comp className={classes} {...props}>
            {leftIcon && <span className={cx('icon')}>{leftIcon}</span>}
            <span className={cx('title')}>{children}</span>
            {rightIcon && <span className={cx('icon')}>{rightIcon}</span>}
        </Comp>
    );
}

Button.propTypes = {
    to: PropTypes.string,
    href: PropTypes.string,
    primary: PropTypes.bool,
    outline: PropTypes.bool,
    text: PropTypes.bool,
    rounded: PropTypes.bool,
    disabled: PropTypes.bool,
    small: PropTypes.bool,
    large: PropTypes.bool,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    leftIcon: PropTypes.node,
    rightIcon: PropTypes.node,
    onClick: PropTypes.func,
};

export default Button;

// Ví dụ gọi: <Button secondary>Đăng ký ngay</Button>
