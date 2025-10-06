// useLocalStorage Hook
// Lưu trữ dữ liệu trong localStorage

import { useState, useEffect } from 'react';

export default function useLocalStorage(key, initialValue) {
    // TODO: Implement useLocalStorage hook
    const [storedValue, setStoredValue] = useState(initialValue);

    return [storedValue, setStoredValue];
}
