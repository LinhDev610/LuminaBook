package com.lumina_book.backend.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.lumina_book.backend.dto.response.CartItemResponse;
import com.lumina_book.backend.dto.response.CartResponse;
import com.lumina_book.backend.entity.Cart;
import com.lumina_book.backend.entity.CartItem;

@Mapper(componentModel = "spring")
public interface CartMapper {

    @Mapping(target = "items", source = "cartItems")
    CartResponse toResponse(Cart cart);

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    CartItemResponse toItemResponse(CartItem cartItem);

    @Named("mapItems")
    default List<CartItemResponse> mapItems(List<CartItem> items) {
        if (items == null) return java.util.List.of();
        return items.stream().map(this::toItemResponse).toList();
    }
}
