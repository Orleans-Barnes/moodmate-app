package com.moodmate.wallet.repository;

import com.moodmate.wallet.entity.TreeSkin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TreeSkinRepository extends JpaRepository<TreeSkin, Long> {
    List<TreeSkin> findAllByOrderBySortOrder();

    Optional<TreeSkin> findByCode(String code);
}
