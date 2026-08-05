package com.moodmate.crisis.controller;

import com.moodmate.crisis.dto.CreateCrisisAlertRequest;
import com.moodmate.crisis.dto.CrisisAlertDto;
import com.moodmate.crisis.service.CrisisAlertService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * Service-to-service only, same pattern as moodmate-wallet's InternalWalletController and
 * moodmate-auth's internal user endpoints: deliberately NOT under /api/crisis/** so no gateway
 * route can ever forward it, and no end-user JWT can reach it even by accident. Called directly
 * by moodmate-ai and moodmate-journal on their own internal address (this service's port 8100),
 * never through the gateway's public port 8080.
 */
@RestController
@RequestMapping("/internal/crisis")
@RequiredArgsConstructor
public class InternalCrisisAlertController {

    private final CrisisAlertService service;

    @PostMapping("/alerts")
    public CrisisAlertDto create(@Valid @RequestBody CreateCrisisAlertRequest req) {
        return service.create(req);
    }
}
