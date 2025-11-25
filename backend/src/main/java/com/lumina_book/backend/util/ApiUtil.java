package com.lumina_book.backend.util;

import java.util.function.Consumer;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import com.lumina_book.backend.dto.response.GhnApiResponse;
import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApiUtil {
    WebClient ghnWebClient;
    static ObjectMapper objectMapper = new ObjectMapper();

    public ApiUtil(@Qualifier("ghnWebClient") WebClient ghnWebClient) {
        this.ghnWebClient = ghnWebClient;
    }

    // =============================== GHN API ===============================

    public <T> T callGhnApi(
            String path,
            HttpMethod method,
            Object payload,
            ParameterizedTypeReference<GhnApiResponse<T>> responseType,
            String token,
            Integer shopId) {
        try {
            GhnApiResponse<T> response = executeGhnRequest(path, method, payload, responseType, token, shopId);

            if (response == null || response.getCode() == null || response.getCode() != 200) {
                log.error("GHN API error: {}", response != null ? response.getMessage() : "Null response");
                throw new AppException(ErrorCode.EXTERNAL_SERVICE_ERROR);
            }

            return response.getData();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error calling GHN API [{} {}]", method, path, e);
            throw new AppException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    // Thực hiện request đến GHN API
    private <T> GhnApiResponse<T> executeGhnRequest(
            String path,
            HttpMethod method,
            Object payload,
            ParameterizedTypeReference<GhnApiResponse<T>> responseType,
            String token,
            Integer shopId) {
 
        WebClient.RequestBodySpec requestSpec = ghnWebClient
                .method(method)
                .uri(path)
                .headers(headers -> configureGhnHeaders(headers, token, shopId));

        WebClient.RequestHeadersSpec<?> headersSpec = payload != null
                ? requestSpec.bodyValue(payload)
                : requestSpec;

        GhnApiResponse<T> response = headersSpec
                .retrieve()
                .onStatus(HttpStatusCode::isError, clientResponse -> clientResponse.bodyToMono(String.class)
                        .flatMap(body -> {
                            return Mono.error(new AppException(ErrorCode.EXTERNAL_SERVICE_ERROR));
                        }))
                .bodyToMono(responseType)
                .block();

        return response;
    }

    private void configureGhnHeaders(HttpHeaders headers, String token, Integer shopId) {
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Token", token);
        headers.set("ShopId", String.valueOf(shopId));
    }

    // =============================== Generic API (for future use) ===============================

    public <T> T callApi(
            String path,
            HttpMethod method,
            Object payload,
            ParameterizedTypeReference<T> responseType,
            Consumer<HttpHeaders> headersConfigurator,
            WebClient webClient) {
        try {
            WebClient.RequestBodySpec requestSpec = webClient
                    .method(method)
                    .uri(path)
                    .headers(headersConfigurator);

            WebClient.RequestHeadersSpec<?> headersSpec = payload != null
                    ? requestSpec.bodyValue(payload)
                    : requestSpec;

            return headersSpec
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, clientResponse -> clientResponse.bodyToMono(String.class)
                            .flatMap(body -> {
                                log.error("API HTTP error {} - {}", clientResponse.statusCode(), body);
                                return Mono.error(new AppException(ErrorCode.EXTERNAL_SERVICE_ERROR));
                            }))
                    .bodyToMono(responseType)
                    .block();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error calling API [{} {}]", method, path, e);
            throw new AppException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    // Serialize payload thành chuỗi JSON
    private String serialize(Object payload) {
        if (payload == null) {
            return "null";
        }
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return payload.toString();
        }
    }
}
