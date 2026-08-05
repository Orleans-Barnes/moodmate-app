package com.moodmate.wallet.repository;

import com.moodmate.wallet.entity.UserOwnedBook;
import com.moodmate.wallet.entity.UserOwnedBookId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserOwnedBookRepository extends JpaRepository<UserOwnedBook, UserOwnedBookId> {
    List<UserOwnedBook> findByIdUserId(Long userId);
}
