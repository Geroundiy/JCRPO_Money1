package com.jcrpo.fieldcontrol.service;

import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.SessionScope;
import java.time.Instant;

@Component
@SessionScope
@Getter
@Setter
public class CurrencyCache {
    private String cachedRates = "[]";
    private Instant lastUpdate = Instant.EPOCH;

}