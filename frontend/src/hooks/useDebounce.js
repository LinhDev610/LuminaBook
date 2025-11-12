// useDebounce Hook
// Debounce giá trị (thường dùng cho search)
// Trả về 1 "Phiên bản trì hoãn" của giá trị, sau khoảng thời gian delay

import { useState, useEffect } from 'react';

export default function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedValue(value);
        }, typeof delay === 'number' ? delay : 300);

        return () => {
            clearTimeout(timerId);
        };
    }, [value, delay]);

    return debouncedValue;
}
