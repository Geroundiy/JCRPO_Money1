package com.jcrpo.fieldcontrol.controller;

import com.jcrpo.fieldcontrol.service.CurrencyCache; // Импортируем новый класс
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import java.time.Duration;
import java.time.Instant;

@RestController
@RequestMapping("/api/currency")
@RequiredArgsConstructor
public class CurrencyController {
    private static final Logger log = LoggerFactory.getLogger(CurrencyController.class);
    private final RestTemplate restTemplate;
    private final CurrencyCache currencyCache; // Внедряем сессионный кэш

    // ИЗМЕНЕНИЕ: URL обновлен для города Минск, как вы просили.
    private static final String BELARUSBANK_API_URL = "https://belarusbank.by/api/kursExchange?city=Гомель";

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getCurrencyRates() {
        // Обновляем курсы для ТЕКУЩЕГО пользователя, если его кэш устарел (старше 5 минут)
        if (Duration.between(currencyCache.getLastUpdate(), Instant.now()).toMinutes() >= 5) {
            log.info("Cache for current session is stale. Refreshing...");
            refreshRatesForSession();
        }
        // Отдаем данные из кэша, уникального для этой сессии
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(currencyCache.getCachedRates());
    }

    // Этот метод теперь приватный и вызывается по необходимости для каждой сессии
    private void refreshRatesForSession() {
        try {
            var resp = restTemplate.getForEntity(BELARUSBANK_API_URL, String.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null && !resp.getBody().isBlank()) {
                // Проверяем, что ответ не пустой массив "[]"
                if (resp.getBody().length() > 2) {
                    currencyCache.setCachedRates(resp.getBody());
                    currencyCache.setLastUpdate(Instant.now());
                    log.info("Currency rates updated successfully for the current session.");
                }
            }
        } catch (Exception ex) {
            log.warn("Failed to refresh currency rates for session: {}", ex.toString());
        }
    }
}