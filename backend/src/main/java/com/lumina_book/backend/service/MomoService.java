package com.lumina_book.backend.service;

import com.lumina_book.backend.client.MomoApi;
import com.lumina_book.backend.dto.request.CreateMomoRequest;
import com.lumina_book.backend.dto.response.CreateMomoResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MomoService {

    @Value(value = "MOMOBKUN20180529")
    private String PARTNER_CODE;

    @Value(value = "k1m05TvNBzhg7h7j")
    private String ACCESS_KEY;

    @Value(value = "at67qH6mk8wSY1nAyMoYkMWACiEi2bsa")
    private String SECRET_KEY;

    @Value(value = "http://localhost:3000/")
    private String REDIRECT_URL;

    @Value(value = "http://localhost:8080/api/momo/ipn-handler")
    private String IPN_URL;

    @Value(value = "captureWallet")
    private String REQUEST_TYPE;

//    private final MomoApi momoApi;
//
//    public CreateMomoResponse createQR(){
//
//        String orderId = UUID.randomUUID().toString();
//        String orderInfo = "Thanh toán đơn hàng: " + orderId;
//        String requestId = UUID.randomUUID().toString();
//        String extraData = "Khong co khuyen mai gi het";
//
//     String rawSignature = String.format("accessKey=$accessKey&amount=$amount&extraData=$extraData" +
//             "&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo" +
//             "&partnerCode=$partnerCode&redirectUrl=$redirectUrl" +
//             "&requestId=$requestId&requestType=$requestType",ACCESS_KEY, amount , )
//    }
//
//
//    CreateMomoRequest request = CreateMomoRequest.builder()
//            .partnerCode(PARTNER_CODE)
//            .requestType(REQUEST_TYPE)
//            .ipnUrl(IPN_URL)
//            .redirectUrl(REDIRECT_URL)
//            .orderId(createQR().getOrderId())
//            .orderInfo(orderInfo)
//            .requestId(requestId)
//            .extraData(extraData)
//            .signature() // LỖI Ở ĐÂY (cần tham số String)
//            .lang("vi")
//            .build();






}
