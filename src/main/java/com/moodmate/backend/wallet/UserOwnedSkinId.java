package com.moodmate.backend.wallet;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

/** Composite key for user_owned_skins (user_id, skin_id) - plain value holder, no JPA proxies involved. */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UserOwnedSkinId implements Serializable {
    private Long userId;
    private Long skinId;
}
