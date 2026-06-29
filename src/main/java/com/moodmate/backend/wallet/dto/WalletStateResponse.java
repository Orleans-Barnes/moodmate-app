package com.moodmate.backend.wallet.dto;

import java.util.List;

public record WalletStateResponse(int leafBalance, List<SkinDto> skins) {
}
