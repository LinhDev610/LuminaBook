// useDebounce Hook
// Debounce giá trị (thường dùng cho search)

import { useState, useEffect } from 'react';

export default function useDebounce(value, delay) {
    // TODO: Implement useDebounce hook
    const [debouncedValue, setDebouncedValue] = useState(value);

    return debouncedValue;
}
