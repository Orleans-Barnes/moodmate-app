package com.moodmate.backend.wallet;

import com.moodmate.backend.security.CurrentUser;
import com.moodmate.backend.wallet.dto.LeafTransactionDto;
import com.moodmate.backend.wallet.dto.PurchaseSkinResponse;
import com.moodmate.backend.wallet.dto.WalletStateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final CurrentUser currentUser;

    @GetMapping
    public WalletStateResponse wallet() {
        return walletService.getWalletState(currentUser.id());
    }

    @GetMapping("/transactions")
    public Page<LeafTransactionDto> transactions(@RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return walletService.getTransactions(currentUser.id(), pageable);
    }

    @PostMapping("/skins/{code}/equip")
    public PurchaseSkinResponse equipSkin(@PathVariable String code) {
        return walletService.equipSkin(currentUser.id(), code);
    }
}
