package com.moodmate.crisis.service;

import com.moodmate.crisis.client.AuthServiceClient;
import com.moodmate.crisis.client.EmergencyContactSummary;
import com.moodmate.crisis.dto.CreateCrisisAlertRequest;
import com.moodmate.crisis.dto.CrisisAlertDto;
import com.moodmate.crisis.dto.EmergencyContactResponse;
import com.moodmate.crisis.entity.CrisisAlert;
import com.moodmate.crisis.entity.CrisisSeverity;
import com.moodmate.crisis.entity.CrisisSource;
import com.moodmate.crisis.exception.ApiException;
import com.moodmate.crisis.repository.CrisisAlertRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Covers Feature 9's Crisis Alert Routing (broadcast on create) and Feature 10's Emergency
 * Contacts crisis-service integration (on-demand primary-contact lookup for a specific alert). */
class CrisisAlertServiceTest {

    private CrisisAlertRepository repository;
    private AuthServiceClient authServiceClient;
    private CrisisAlertService service;

    @BeforeEach
    void setUp() {
        repository = mock(CrisisAlertRepository.class);
        authServiceClient = mock(AuthServiceClient.class);
        service = new CrisisAlertService(repository, authServiceClient);
    }

    @Test
    void createBroadcastsToAdminAndCounsellorRoles() {
        when(repository.save(any(CrisisAlert.class))).thenAnswer(inv -> {
            CrisisAlert a = inv.getArgument(0);
            a.setId(42L);
            a.setCreatedAt(Instant.now());
            return a;
        });

        CreateCrisisAlertRequest request = new CreateCrisisAlertRequest(9L, "trigger text",
                List.of("suicide"), CrisisSeverity.HIGH, CrisisSource.AI_CHAT);

        CrisisAlertDto dto = service.create(request);

        assertEquals(42L, dto.id());
        verify(authServiceClient).notifyRoles(eq(List.of("ADMIN", "COUNSELLOR")), eq("New crisis alert"),
                any(), eq(Map.of("screen", "CrisisAlerts", "alertId", "42", "severity", "HIGH")));
    }

    @Test
    void getEmergencyContactReturnsTheAlertUsersPrimaryContact() {
        CrisisAlert alert = CrisisAlert.builder().id(42L).userId(9L).triggerText("t")
                .matchedKeywords("suicide").severity(CrisisSeverity.HIGH).source(CrisisSource.AI_CHAT).build();
        when(repository.findById(42L)).thenReturn(Optional.of(alert));
        when(authServiceClient.getPrimaryEmergencyContact(9L))
                .thenReturn(new EmergencyContactSummary("Mom", "555-1234", "Mother"));

        EmergencyContactResponse response = service.getEmergencyContact(42L);

        assertEquals("Mom", response.name());
        assertEquals("555-1234", response.phone());
        assertEquals("Mother", response.relationship());
    }

    @Test
    void getEmergencyContactReturnsEmptyResponseWhenNoneOnFile() {
        CrisisAlert alert = CrisisAlert.builder().id(42L).userId(9L).triggerText("t")
                .matchedKeywords("suicide").severity(CrisisSeverity.HIGH).source(CrisisSource.AI_CHAT).build();
        when(repository.findById(42L)).thenReturn(Optional.of(alert));
        when(authServiceClient.getPrimaryEmergencyContact(9L)).thenReturn(null);

        EmergencyContactResponse response = service.getEmergencyContact(42L);

        assertNull(response.name());
        assertNull(response.phone());
    }

    @Test
    void getEmergencyContactRejectsUnknownAlert() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () -> service.getEmergencyContact(999L));
        assertEquals(org.springframework.http.HttpStatus.NOT_FOUND, ex.getStatus());
    }
}
