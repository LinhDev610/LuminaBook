package com.lumina_book.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.lumina_book.backend.dto.request.ApiResponse;
import com.lumina_book.backend.service.FileStorageService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MediaController {

    FileStorageService fileStorageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<String>> uploadMedia(@RequestPart("files") List<MultipartFile> files) {
        List<String> urls = files.stream()
                .map(fileStorageService::storeFile)
                .collect(Collectors.toList());
        return ApiResponse.<List<String>>builder().result(urls).build();
    }
}


