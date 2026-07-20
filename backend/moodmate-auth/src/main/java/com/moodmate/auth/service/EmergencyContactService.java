package com.moodmate.auth.service;

import com.moodmate.auth.dto.CreateEmergencyContactRequest;
import com.moodmate.auth.dto.EmergencyContactResponse;
import com.moodmate.auth.dto.EmergencyContactSummary;
import com.moodmate.auth.dto.UpdateEmergencyContactRequest;
import com.moodmate.auth.entity.EmergencyContact;
import com.moodmate.auth.exception.ApiException;
import com.moodmate.auth.repository.EmergencyContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** New for Feature 10 (Emergency Contacts) - fully greenfield, no monolith equivalent. Primary-
 * contact invariant ("at most one primary per user") is enforced here (unset-then-set, in that
 * order, within the same transaction) AND at the database level via V9's partial unique index -
 * defense in depth, not redundancy: the DB constraint is what actually prevents a bug here from
 * ever producing two primaries, this service logic is what keeps that from ever being triggered
 * by ordinary use. */
@Service
@RequiredArgsConstructor
public class EmergencyContactService {

    private final EmergencyContactRepository repository;

    @Transactional(readOnly = true)
    public List<EmergencyContactResponse> list(Long userId) {
        return repository.findByUserIdOrderByPrimaryDescCreatedAtAsc(userId).stream().map(this::toResponse).toList();
    }

    /** The very first contact a user adds always becomes primary, regardless of what the request
     * asked for - a brand new user with exactly one contact and no primary set would otherwise
     * leave the crisis-service integration with nothing to show, which defeats the point of the
     * feature. Every contact after the first respects the request's isPrimary flag normally. */
    @Transactional
    public EmergencyContactResponse create(Long userId, CreateEmergencyContactRequest request) {
        boolean isFirstContact = repository.countByUserId(userId) == 0;
        boolean makesPrimary = isFirstContact || request.isPrimary();

        if (makesPrimary) {
            unsetExistingPrimary(userId);
        }

        EmergencyContact contact = EmergencyContact.builder()
                .userId(userId)
                .name(request.name())
                .phone(request.phone())
                .relationship(request.relationship())
                .notes(request.notes())
                .primary(makesPrimary)
                .build();

        return toResponse(repository.save(contact));
    }

    @Transactional
    public EmergencyContactResponse update(Long userId, Long contactId, UpdateEmergencyContactRequest request) {
        EmergencyContact contact = findOwned(userId, contactId);

        if (request.isPrimary() && !contact.isPrimary()) {
            unsetExistingPrimary(userId);
            contact.setPrimary(true);
        } else if (!request.isPrimary() && contact.isPrimary()) {
            // Explicitly un-primary-ing your only/current primary contact is allowed - a user is
            // free to end up with no primary contact at all; nothing auto-promotes another one on
            // an explicit un-set (unlike delete(), see its doc comment).
            contact.setPrimary(false);
        }

        contact.setName(request.name());
        contact.setPhone(request.phone());
        contact.setRelationship(request.relationship());
        contact.setNotes(request.notes());

        return toResponse(repository.save(contact));
    }

    /** Dedicated action for "make this my primary contact" without resending the full edit form -
     * same unset-then-set semantics as create()/update(). */
    @Transactional
    public EmergencyContactResponse setPrimary(Long userId, Long contactId) {
        EmergencyContact contact = findOwned(userId, contactId);
        if (!contact.isPrimary()) {
            unsetExistingPrimary(userId);
            contact.setPrimary(true);
            contact = repository.save(contact);
        }
        return toResponse(contact);
    }

    /** Deleting the primary contact auto-promotes the next-oldest remaining contact (if any) to
     * primary, rather than silently leaving the user with none - unlike explicitly un-primary-ing
     * a contact via update() (a deliberate user choice to have no primary), a delete is not a
     * choice about primary status at all, so this preserves "has a primary if any contact exists"
     * as an ordinary-use invariant without forcing it at the database level (V9's index only
     * enforces "at most one", not "at least one" - a user with zero contacts obviously has none). */
    @Transactional
    public void delete(Long userId, Long contactId) {
        EmergencyContact contact = findOwned(userId, contactId);
        boolean wasPrimary = contact.isPrimary();
        repository.delete(contact);

        if (wasPrimary) {
            repository.findByUserIdOrderByPrimaryDescCreatedAtAsc(userId).stream()
                    .findFirst()
                    .ifPresent(next -> {
                        next.setPrimary(true);
                        repository.save(next);
                    });
        }
    }

    /** Cross-service read for moodmate-crisis (InternalEmergencyContactController) - null, not an
     * exception, when the user has no contacts at all or none is marked primary. */
    @Transactional(readOnly = true)
    public EmergencyContactSummary getPrimarySummary(Long userId) {
        return repository.findByUserIdAndPrimaryTrue(userId)
                .map(c -> new EmergencyContactSummary(c.getName(), c.getPhone(), c.getRelationship()))
                .orElse(null);
    }

    private void unsetExistingPrimary(Long userId) {
        repository.findByUserIdAndPrimaryTrue(userId).ifPresent(existing -> {
            existing.setPrimary(false);
            repository.save(existing);
        });
    }

    private EmergencyContact findOwned(Long userId, Long contactId) {
        return repository.findByIdAndUserId(contactId, userId)
                .orElseThrow(() -> new ApiException("Emergency contact not found: " + contactId, HttpStatus.NOT_FOUND));
    }

    private EmergencyContactResponse toResponse(EmergencyContact c) {
        return new EmergencyContactResponse(c.getId(), c.getName(), c.getPhone(), c.getRelationship(),
                c.getNotes(), c.isPrimary(), c.getCreatedAt(), c.getUpdatedAt());
    }
}
