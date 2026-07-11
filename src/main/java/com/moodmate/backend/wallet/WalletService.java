package com.moodmate.backend.wallet;

import com.moodmate.backend.common.GoalEngine;
import com.moodmate.backend.common.api.SkinLookupApi;
import com.moodmate.backend.common.api.WalletInternalApi;
import com.moodmate.backend.common.exception.InsufficientBalanceException;
import com.moodmate.backend.common.exception.ResourceNotFoundException;
import com.moodmate.backend.wallet.dto.LeafTransactionDto;
import com.moodmate.backend.wallet.dto.PurchaseSkinResponse;
import com.moodmate.backend.wallet.dto.SkinDto;
import com.moodmate.backend.wallet.dto.WalletStateResponse;
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

/**
 * Manages leaf balances, tree skins, and leaf transaction history.
 *
 * Implements {@link WalletInternalApi} so the payments domain can credit leaves after a
 * successful Paystack payment without importing wallet repositories directly.
 *
 * Implements {@link SkinLookupApi} so the wellness domain can resolve skin display data
 * (emoji, ID-by-code) without importing from the wallet package directly.
 *
 * Note: WellnessProfile (which holds leafBalance and treeSkinId) lives in the wellness
 * package but is accessed here directly because both domains share the same database row.
 * This is a documented, intentional coupling at the persistence layer — the only remaining
 * cross-domain import in the wallet package.
 */
@Service
@RequiredArgsConstructor
public class WalletService implements WalletInternalApi, SkinLookupApi {

    private final WellnessProfileRepository wellnessProfileRepository;
    private final TreeSkinRepository treeSkinRepository;
    private final UserOwnedSkinRepository userOwnedSkinRepository;
    private final LeafTransactionRepository leafTransactionRepository;

    // ── WalletInternalApi ─────────────────────────────────────────────────────

    /**
     * Credits leaves and records the transaction. Called by payments after a successful
     * Paystack leaf-pack purchase — payments never touches wellness or wallet repos directly.
     *
     * @param reason must be a valid {@link LeafTransactionReason} name
     */
    @Override
    @Transactional
    public void creditLeaves(Long userId, int amount, String reason) {
        WellnessProfile profile = wellnessProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Wellness profile not found for user " + userId));
        profile.setLeafBalance(GoalEngine.credit(profile.getLeafBalance(), amount));
        wellnessProfileRepository.save(profile);
        leafTransactionRepository.save(LeafTransaction.builder()
                .userId(userId)
                .amount(amount)
                .reason(LeafTransactionReason.valueOf(reason))
                .build());
    }

    // ── SkinLookupApi ─────────────────────────────────────────────────────────

    @Override
    public String getEmoji(Long skinId) {
        return treeSkinRepository.findById(skinId)
                .map(TreeSkin::getEmoji)
                .orElse("🌳");
    }

    @Override
    public Long getSkinIdByCode(String skinCode) {
        return treeSkinRepository.findByCode(skinCode)
                .orElseThrow(() -> new IllegalStateException(
                        "Tree skin '" + skinCode + "' is missing — check V2__seed_reference_data.sql"))
                .getId();
    }

    // ── Public wallet API ─────────────────────────────────────────────────────

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

    // ── Helpers ───────────────────────────────────────────────────────────────

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
