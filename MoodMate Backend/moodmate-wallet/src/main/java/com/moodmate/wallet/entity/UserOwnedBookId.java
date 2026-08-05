package com.moodmate.wallet.entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

/** Composite key for user_owned_books (user_id, book_id) - mirrors UserOwnedSkinId exactly. */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UserOwnedBookId implements Serializable {
    private Long userId;
    private Long bookId;
}
