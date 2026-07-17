package com.moodmate.wallet.controller;

import com.moodmate.wallet.dto.LeafTransactionDto;
import com.moodmate.wallet.dto.PurchaseSkinResponse;
import com.moodmate.wallet.dto.WalletStateResponse;
import com.moodmate.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public WalletStateResponse wallet(@RequestHeader("X-User-Id") Long userId) {
        return walletService.getWalletState(userId);
    }

    @GetMapping("/transactions")
    public Page<LeafTransactionDto> transactions(@RequestHeader("X-User-Id") Long userId,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return walletService.getTransactions(userId, pageable);
    }

    @PostMapping("/skins/{code}/equip")
    public PurchaseSkinResponse equipSkin(@RequestHeader("X-User-Id") Long userId, @PathVariable String code) {
        return walletService.equipSkin(userId, code);
    }
}
