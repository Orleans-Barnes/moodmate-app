package com.moodmate.wallet.service;

import com.moodmate.wallet.client.AuthServiceClient;
import com.moodmate.wallet.client.InstitutionServiceClient;
import com.moodmate.wallet.dto.LeafTransactionDto;
import com.moodmate.wallet.dto.PurchaseSkinResponse;
import com.moodmate.wallet.dto.SkinDto;
import com.moodmate.wallet.dto.WalletStateResponse;
import com.moodmate.wallet.entity.LeafTransaction;
import com.moodmate.wallet.entity.LeafTransactionReason;
import com.moodmate.wallet.entity.LeafWallet;
import com.moodmate.wallet.entity.SubscriptionStatus;
import com.moodmate.wallet.entity.TreeSkin;
import com.moodmate.wallet.entity.UserOwnedSkin;
import com.moodmate.wallet.entity.UserOwnedSkinId;
import com.moodmate.wallet.exception.ApiException;
import com.moodmate.wallet.repository.LeafTransactionRepository;
import com.moodmate.wallet.repository.LeafWalletRepository;
import com.moodmate.wallet.repository.TreeSkinRepository;
import com.moodmate.wallet.repository.UserOwnedSkinRepository;
import com.moodmate.wallet.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final LeafWalletRepository leafWalletRepository;
    private final TreeSkinRepository treeSkinRepository;
    private final UserOwnedSkinRepository userOwnedSkinRepository;
    private final LeafTransactionRepository leafTransactionRepository;
    // Premium gating breadth (Milestone item 7) - queried directly rather than through
    // PaymentsService: PaymentsService itself depends on WalletService (to credit leaves on a
    // successful payment), so injecting PaymentsService here created a circular bean dependency
    // that only surfaces at Spring context startup, not at compile time. This repository has no
    // dependency on WalletService, so it's safe to use directly for the pro-only-skin check.
    private final UserSubscriptionRepository userSubscriptionRepository;
    // Institution Management (Milestone 2, Step 3-4). Neither client depends on WalletService, so
    // both are safe to inject directly - same "no circular bean dependency" reasoning as
    // userSubscriptionRepository above.
    private final AuthServiceClient authServiceClient;
    private final InstitutionServiceClient institutionServiceClient;

    @Transactional
    public WalletStateResponse getWalletState(Long userId) {
        LeafWallet wallet = getOrCreateWallet(userId);
        return buildWalletState(wallet);
    }

    /**
     * Cross-service read for other services that need just the leaf balance and the equipped
     * skin's display emoji - e.g. wellness-service's WellnessStateResponse.treeSkinEmoji /
     * leafBalance fields, which the monolith read directly off WellnessProfile (this service owns
     * that data now). See InternalWalletController - not reachable through the gateway.
     */
    @Transactional
    public com.moodmate.wallet.dto.InternalWalletSummary getInternalSummary(Long userId) {
        LeafWallet wallet = getOrCreateWallet(userId);
        String emoji = wallet.getEquippedSkinId() == null
                ? "🌳"
                : treeSkinRepository.findById(wallet.getEquippedSkinId()).map(TreeSkin::getEmoji).orElse("🌳");
        return new com.moodmate.wallet.dto.InternalWalletSummary(wallet.getLeafBalance(), emoji);
    }

    @Transactional(readOnly = true)
    public Page<LeafTransactionDto> getTransactions(Long userId, Pageable pageable) {
        return leafTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(t -> new LeafTransactionDto(t.getId(), t.getAmount(), t.getReason(), t.getCreatedAt()));
    }

    /**
     * Equips a skin, purchasing it first if needed. Free skins and already-owned skins are
     * equipped at no cost. Otherwise a cost greater than the available balance is rejected with no
     * mutation at all - no charge, no ownership row, no equip.
     */
    @Transactional
    public PurchaseSkinResponse equipSkin(Long userId, String skinCode) {
        LeafWallet wallet = getOrCreateWallet(userId);
        TreeSkin skin = treeSkinRepository.findByCode(skinCode)
                .orElseThrow(() -> new ApiException("Unknown tree skin: " + skinCode, HttpStatus.NOT_FOUND));

        // Premium gating breadth (Milestone item 7) - a Pro-only skin requires an ACTIVE Pro
        // subscription to equip, checked every time (not just at first purchase). This is a
        // deliberate "requires active Pro" design, not "requires having purchased it once" - if a
        // Pro user buys GOLDEN then lets their subscription lapse, they keep ownership (still
        // counted in userOwnedSkinRepository, no refund) but can't re-equip it until Pro is active
        // again. Checked before the cost/ownership logic below so it blocks unconditionally,
        // whether or not the skin is already owned.
        if (skin.isProOnly() && !isPro(userId)) {
            throw new ApiException(
                    "\"" + skin.getName() + "\" is exclusive to MoodMate Pro. Upgrade to unlock it.",
                    HttpStatus.PAYMENT_REQUIRED);
        }

        UserOwnedSkinId ownershipId = new UserOwnedSkinId(userId, skin.getId());
        boolean alreadyOwned = skin.getCost() == 0 || userOwnedSkinRepository.existsById(ownershipId);

        if (!alreadyOwned) {
            if (skin.getCost() > wallet.getLeafBalance()) {
                throw new ApiException(
                        "Not enough leaves to buy this skin: need " + skin.getCost() + ", have " + wallet.getLeafBalance(),
                        HttpStatus.PAYMENT_REQUIRED);
            }
            wallet.setLeafBalance(wallet.getLeafBalance() - skin.getCost());

            userOwnedSkinRepository.save(UserOwnedSkin.builder().id(ownershipId).build());
            leafTransactionRepository.save(LeafTransaction.builder()
                    .userId(userId)
                    .amount(-skin.getCost())
                    .reason(LeafTransactionReason.SKIN_PURCHASE)
                    .build());
        }

        wallet.setEquippedSkinId(skin.getId());
        leafWalletRepository.save(wallet);

        return new PurchaseSkinResponse(buildWalletState(wallet), alreadyOwned);
    }

    /**
     * Internal, service-to-service credit - called by wellness-service (goal-completion reward),
     * mood-service (check-in reward), journal-service (gratitude reward), etc. Mirrors the
     * monolith's GoalEngine.credit(): crediting leaves never fails.
     */
    @Transactional
    public WalletStateResponse creditLeaves(Long userId, int amount, LeafTransactionReason reason) {
        LeafWallet wallet = getOrCreateWallet(userId);
        wallet.setLeafBalance(wallet.getLeafBalance() + amount);
        leafWalletRepository.save(wallet);

        leafTransactionRepository.save(LeafTransaction.builder()
                .userId(userId)
                .amount(amount)
                .reason(reason)
                .build());

        return buildWalletState(wallet);
    }

    /**
     * Internal, service-to-service debit - added for wellness-service's streak-shield purchase
     * (POST /api/wellness/streak/shield). Mirrors equipSkin's balance check: a debit greater than
     * the current balance is rejected (402) with no mutation at all, rather than allowing the
     * balance to go negative. Unlike creditLeaves, this CAN fail.
     */
    @Transactional
    public WalletStateResponse debitLeaves(Long userId, int amount, LeafTransactionReason reason) {
        LeafWallet wallet = getOrCreateWallet(userId);
        if (amount > wallet.getLeafBalance()) {
            throw new ApiException(
                    "Not enough leaves: need " + amount + ", have " + wallet.getLeafBalance(),
                    HttpStatus.PAYMENT_REQUIRED);
        }
        wallet.setLeafBalance(wallet.getLeafBalance() - amount);
        leafWalletRepository.save(wallet);

        leafTransactionRepository.save(LeafTransaction.builder()
                .userId(userId)
                .amount(-amount)
                .reason(reason)
                .build());

        return buildWalletState(wallet);
    }

    // Mirrors PaymentsService.toStateResponse's "pro" definition exactly (ACTIVE, TRIALING,
    // PAST_DUE/grace-period, or institution-license-covered) - duplicated here rather than shared
    // to avoid the circular dependency explained on the userSubscriptionRepository field above. If
    // that definition ever changes, update both.
    private boolean isPro(Long userId) {
        boolean individuallyPro = userSubscriptionRepository.findByUserId(userId)
                .map(sub -> sub.getStatus() == SubscriptionStatus.ACTIVE || sub.getStatus() == SubscriptionStatus.TRIALING
                        || sub.getStatus() == SubscriptionStatus.PAST_DUE)
                .orElse(false);
        if (individuallyPro) return true;

        // Institution Management (Milestone 2, Step 3-4).
        Long institutionId = authServiceClient.getInstitutionId(userId);
        return institutionId != null && institutionServiceClient.isLicenseActive(institutionId);
    }

    private LeafWallet getOrCreateWallet(Long userId) {
        return leafWalletRepository.findByUserId(userId).orElseGet(() -> {
            LeafWallet created = LeafWallet.builder().userId(userId).leafBalance(0).build();
            // New wallets start equipped with the free default skin (lowest sort_order, cost 0).
            // Falls back to unequipped (null) if the reference-data seed hasn't run yet, rather
            // than failing wallet creation entirely.
            treeSkinRepository.findAllByOrderBySortOrder().stream()
                    .filter(s -> s.getCost() == 0)
                    .findFirst()
                    .ifPresent(defaultSkin -> created.setEquippedSkinId(defaultSkin.getId()));
            return leafWalletRepository.save(created);
        });
    }

    private WalletStateResponse buildWalletState(LeafWallet wallet) {
        Set<Long> ownedSkinIds = userOwnedSkinRepository.findByIdUserId(wallet.getUserId()).stream()
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
                        skin.getId().equals(wallet.getEquippedSkinId()),
                        skin.isProOnly()
                ))
                .toList();

        return new WalletStateResponse(wallet.getLeafBalance(), skins);
    }
}
