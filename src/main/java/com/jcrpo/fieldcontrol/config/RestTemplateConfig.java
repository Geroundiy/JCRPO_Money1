package com.jcrpo.fieldcontrol.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.security.cert.X509Certificate;
import java.time.Duration;

@Configuration
public class RestTemplateConfig {

    // Таймауты (в миллисекундах)
    private static final int CONNECT_TIMEOUT_MS = 3000; // 3 секунды
    private static final int READ_TIMEOUT_MS = 4000;    // 4 секунды

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) throws Exception {
        // WARNING: trust-all для разработки. Уберите/замените в продакшне.
        TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    @Override
                    public X509Certificate[] getAcceptedIssuers() {
                        return new X509Certificate[0];
                    }
                    @Override
                    public void checkClientTrusted(X509Certificate[] certs, String authType) { /* trust all */ }
                    @Override
                    public void checkServerTrusted(X509Certificate[] certs, String authType) { /* trust all */ }
                }
        };

        SSLContext sslContext = SSLContext.getInstance("TLS");
        sslContext.init(null, trustAllCerts, new java.security.SecureRandom());

        // Фабрика с установкой SSL-сокет-фабрики и hostname verifier
        SimpleClientHttpRequestFactory customRequestFactory = new SimpleClientHttpRequestFactory() {
            @Override
            protected void prepareConnection(HttpURLConnection connection, String httpMethod) throws IOException {
                if (connection instanceof HttpsURLConnection) {
                    ((HttpsURLConnection) connection).setSSLSocketFactory(sslContext.getSocketFactory());
                    ((HttpsURLConnection) connection).setHostnameVerifier((hostname, session) -> true);
                }
                super.prepareConnection(connection, httpMethod);
            }
        };

        // Установим таймауты в фабрике (миллисекунды)
        customRequestFactory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        customRequestFactory.setReadTimeout(READ_TIMEOUT_MS);

        // И установим таймауты через RestTemplateBuilder (для дополнительной совместимости)
        return builder
                .requestFactory(() -> customRequestFactory)
                .setConnectTimeout(Duration.ofMillis(CONNECT_TIMEOUT_MS))
                .setReadTimeout(Duration.ofMillis(READ_TIMEOUT_MS))
                .build();
    }
}