package com.moodmate.wallet.repository;

import com.moodmate.wallet.entity.LeafPack;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeafPackRepository extends JpaRepository<LeafPack, Long> {
    Optional<LeafPack> findByCode(String code);

    List<LeafPack> findAllByOrderBySortOrderAsc();
}
