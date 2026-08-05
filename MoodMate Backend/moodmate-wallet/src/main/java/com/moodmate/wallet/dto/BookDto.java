package com.moodmate.wallet.dto;

/** owned reflects the calling user's own purchase history - true once a UserOwnedBook row exists
 *  for them, false otherwise (never cached across users). */
public record BookDto(String code, String title, String author, String description,
                       int pricePesewas, boolean owned) {
}
