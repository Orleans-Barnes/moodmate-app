package com.moodmate.wallet.repository;

import com.moodmate.wallet.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {
    Optional<Book> findByCode(String code);

    List<Book> findAllByOrderBySortOrderAsc();
}
