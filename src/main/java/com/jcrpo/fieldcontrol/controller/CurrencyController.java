package com.jcrpo.fieldcontrol.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/currency")
@RequiredArgsConstructor
public class CurrencyController {

    // Используем RestTemplate, который был настроен в RestTemplateConfig для обхода SSL
    private final RestTemplate restTemplate;

    // ВОЗВРАЩАЕМСЯ К API БЕЛАРУСБАНКА, так как API Альфа-Банка требует сложной авторизации
    private static final String BELARUSBANK_API_URL = "https://belarusbank.by/api/kursExchange?city=Минск";

    @GetMapping
    public ResponseEntity<String> getCurrencyRates() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(BELARUSBANK_API_URL, String.class);
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error fetching currency rates.");
        }
    }
}