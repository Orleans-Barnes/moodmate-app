package com.moodmate.wallet.client;

import com.moodmate.wallet.config.ServiceClientsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

/** Direct (non-gateway) service-to-service call to admin-service. Institution Management
 * (Milestone 2, Step 3-4) - "does this institution's license currently cover its students",
 * consumed by WalletService.isPro/PaymentsService.toStateResponse to extend Pro-status checks to
 * institution-licensed students. Fail-safe (returns false, doesn't throw) on any error - same
 * reasoning as AuthServiceClient.getInstitutionId: a transient admin-service outage must never
 * accidentally grant Pro (fail closed), and must never block the whole subscription-state read
 * either. */
@Slf4j
@Component
@RequiredArgsConstructor
public class InstitutionServiceClient {

    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 5000;

    private final ServiceClientsProperties properties;

    public boolean isLicenseActive(Long institutionId) {
        try {
            Map<String, Boolean> response = restClient().get()
                    .uri("/internal/institutions/{id}/license-active", institutionId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Boolean>>() {});
            return response != null && Boolean.TRUE.equals(response.get("active"));
        } catch (RestClientException e) {
            log.warn("Could not reach admin-service to check license status for institution {}: {}",
                    institutionId, e.getMessage());
            return false;
        }
    }

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(properties.adminBaseUrl()).requestFactory(factory).build();
    }
}
