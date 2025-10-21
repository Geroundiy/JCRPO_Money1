package com.jcrpo.fieldcontrol.controller;

import com.jcrpo.fieldcontrol.service.CurrencyCache;
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
    private final CurrencyCache currencyCache;

    // Белорусбанк API (по Минску)
    private static final String BELARUSBANK_API_URL =
            "https://belarusbank.by/api/kursExchange?city=Минск";

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getCurrencyRates() {
        try {
            boolean needRefresh =
                    currencyCache.getCachedRates() == null ||
                            currencyCache.getCachedRates().isBlank() ||
                            Duration.between(currencyCache.getLastUpdate(), Instant.now()).toMinutes() >= 5;

            if (needRefresh) {
                log.info("Refreshing currency rates from Belarusbank API...");
                refreshRatesForSession();
            }

            String cached = currencyCache.getCachedRates();
            if (cached == null || cached.isBlank() || cached.trim().equals("[]")) {
                log.warn("Currency rates cache is empty — returning fallback JSON.");
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("[{\"USD_in\":\"3.2650\",\"USD_out\":\"3.2950\",\"EUR_in\":\"3.4550\",\"EUR_out\":\"3.4950\",\"RUB_in\":\"3.2500\",\"RUB_out\":\"3.3900\",\"CNY_in\":\"0.4500\",\"CNY_out\":\"0.4600\"}]");
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(cached);

        } catch (Exception ex) {
            log.error("Error getting currency rates: {}", ex.toString());
            // Возврат безопасного дефолтного ответа
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("[{\"USD_in\":\"3.2650\",\"USD_out\":\"3.2950\",\"EUR_in\":\"3.4550\",\"EUR_out\":\"3.4950\",\"RUB_in\":\"3.2500\",\"RUB_out\":\"3.3900\",\"CNY_in\":\"0.4500\",\"CNY_out\":\"0.4600\"}]");
        }
    }

    private void refreshRatesForSession() {
        try {
            var resp = restTemplate.getForEntity(BELARUSBANK_API_URL, String.class);

            if (resp.getStatusCode().is2xxSuccessful()) {
                String body = resp.getBody();
                log.info("Response from Belarusbank API: {}", body);

                // Даже если тело — пустой массив, обновляем кэш (чтобы не было null)
                if (body != null && !body.isBlank()) {
                    currencyCache.setCachedRates(body);
                    currencyCache.setLastUpdate(Instant.now());
                    log.info("Currency rates cached successfully at {}", currencyCache.getLastUpdate());
                } else {
                    log.warn("Received empty response from Belarusbank API.");
                }
            } else {
                log.warn("Belarusbank API responded with non-OK status: {}", resp.getStatusCode());
            }

        } catch (Exception ex) {
            log.error("Failed to refresh currency rates: {}", ex.toString());
        }
    }
}