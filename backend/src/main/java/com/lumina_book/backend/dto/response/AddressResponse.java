package com.lumina_book.backend.dto.response;

import java.time.LocalDateTime;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddressResponse {
    String id;

    String recipientName;
    String recipientPhoneNumber;
    String provinceName;
    String provinceID;
    String districtName;
    String districtID;
    String wardName;
    String wardCode;

    String address;

    String postalCode;
    
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    boolean isDefault;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    
    public boolean isDefault() {
        return this.isDefault;
    }
    
    public void setDefault(boolean isDefault) {
        this.isDefault = isDefault;
    }
}
