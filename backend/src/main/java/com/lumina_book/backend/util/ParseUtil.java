package com.lumina_book.backend.util;

import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;

public final class ParseUtil {
    private ParseUtil() {
    }

    public static Integer parseInteger(String value, String fieldName) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
    }
}
