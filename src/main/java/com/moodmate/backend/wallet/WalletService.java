package com.moodmate.backend.wallet;

import com.moodmate.backend.common.exception.InsufficientBalanceException;
import com.moodmate.backend.common.exception.ResourceNotFoundException;
import com.moodmate.backend.wallet.dto.LeafTransactionDto;
import com.moodmate.backend.wallet.dto.PurchaseSkinResponse;
import com.moodmate.backend.wallet.dto.SkinDto;
import com.moodmate.backend.wallet.dto.WalletStateResponse;
import com.moodmate.backend.wellness.GoalEngine;
import com.moodmate.backend.wellness.WellnessProfile;
import com.moodmate.backend.wellness.WellnessProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WellnessProfileRepository wellnessProfileRepository;
    private final TreeSkinRepository treeSkinRepository;
    private final UserOwnedSkinRepository userOwnedSkinRepository;
    private final LeafTransactionRepository leafTransactionRepository;

    @Transactional(readOnly = true)
    public WalletStateResponse getWalletState(Long userId) {
        WellnessProfile profile = findProfile(userId);
        return buildWalletState(userId, profile);
    }

    @Transactional(readOnly = true)
    public Page<LeafTransactionDto> getTransactions(Long userId, Pageable pageable) {
        return leafTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(t -> new LeafTransactionDto(t.getId(), t.getAmount(), t.getReason(), t.getCreatedAt()));
    }

    /**
     * Equips a skin, purchasing it first if needed. Free skins and already-owned skins are
     * equipped at no cost. Otherwise this enforces the balance guard from
     * {@link GoalEngine#purchase}: a cost greater than the available balance is rejected with no
     * mutation at all - no charge, no ownership row, no equip.
     */
    @Transactional
    public PurchaseSkinResponse equipSkin(Long userId, String skinCode) {
        WellnessProfile profile = findProfile(userId);
        TreeSkin skin = treeSkinRepository.findByCode(skinCode)
                .orElseThrow(() -> new ResourceNotFoundException("Unknown tree skin: " + skinCode));

        UserOwnedSkinId ownershipId = new UserOwnedSkinId(userId, skin.getId());
        boolean alreadyOwned = skin.getCost() == 0 || userOwnedSkinRepository.existsById(ownershipId);

        if (!alreadyOwned) {
            GoalEngine.BalanceMutationResult result = GoalEngine.purchase(profile.getLeafBalance(), skin.getCost());
            if (!result.success()) {
                throw new InsufficientBalanceException(
                        "Not enough leaves to buy this skin: need " + skin.getCost() + ", have " + profile.getLeafBalance());
            }

            profile.setLeafBalance(result.newLeafBalance());

            userOwnedSkinRepository.save(UserOwnedSkin.builder().id(ownershipId).build());
            leafTransactionRepository.save(LeafTransaction.builder()
                    .userId(userId)
                    .amount(-skin.getCost())
                    .reason(LeafTransactionReason.SKIN_PURCHASE)
                    .build());
        }

        profile.setTreeSkinId(skin.getId());
        wellnessProfileRepository.save(profile);

        return new PurchaseSkinResponse(buildWalletState(userId, profile), alreadyOwned);
    }

    private WalletStateResponse buildWalletState(Long userId, WellnessProfile profile) {
        Set<Long> ownedSkinIds = userOwnedSkinRepository.findByIdUserId(userId).stream()
                .map(o -> o.getId().getSkinId())
                .collect(Collectors.toSet());

        List<SkinDto> skins = treeSkinRepository.findAllByOrderBySortOrder().stream()
                .map(skin -> new SkinDto(
                        skin.getId(),
                        skin.getCode(),
                        skin.getEmoji(),
                        skin.getName(),
                        skin.getCost(),
                        skin.getCost() == 0 || ownedSkinIds.contains(skin.getId()),
                        skin.getId().equals(profile.getTreeSkinId())
                ))
                .toList();

        return new WalletStateResponse(profile.getLeafBalance(), skins);
    }

    private WellnessProfile findProfile(Long userId) {
        return wellnessProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Wellness profile not found - this should be created automatically on signup"));
    }
}
