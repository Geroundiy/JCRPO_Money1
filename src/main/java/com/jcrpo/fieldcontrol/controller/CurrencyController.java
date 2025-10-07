package com.jcrpo.fieldcontrol.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;

@RestController
@RequestMapping("/api/currency")
@RequiredArgsConstructor
public class CurrencyController {

    private static final Logger log = LoggerFactory.getLogger(CurrencyController.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final RestTemplate restTemplate;
    private static final String BELARUSBANK_API_URL = "https://belarusbank.by/api/kursExchange?city=Минск";

    // Кэш курсов
    private static String cachedRates = "[{\"USD_in\":3.2000,\"USD_out\":3.2500}]"; // минимальные значения по умолчанию
    private static Instant lastUpdate = Instant.EPOCH;

    /** Возвращает кэшированные данные — мгновенно, без запроса во внешний интернет */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getCurrencyRates() {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(cachedRates);
    }

    /** Фоновое обновление курсов раз в 15 минут — не блокирует вход */
    @Scheduled(fixedDelay = 15 * 60 * 1000)
    public void refreshRates() {
        try {
            var resp = restTemplate.getForEntity(BELARUSBANK_API_URL, String.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null && !resp.getBody().isBlank()) {
                // проверим что это JSON
                JsonNode node = MAPPER.readTree(resp.getBody());
                cachedRates = resp.getBody();
                lastUpdate = Instant.now();
                log.info("Currency rates updated successfully at {}", lastUpdate);
            }
        } catch (Exception ex) {
            log.warn("Failed to refresh currency rates: {}", ex.toString());
        }
    }
}
