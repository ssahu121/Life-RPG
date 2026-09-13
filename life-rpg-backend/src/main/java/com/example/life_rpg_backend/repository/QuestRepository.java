package com.example.life_rpg_backend.repository;

import com.example.life_rpg_backend.entity.Quest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuestRepository extends JpaRepository<Quest, Long> {

    List<Quest> findByUserId(Long userId);

    Optional<Quest> findByIdAndUserId(Long id, Long userId);
}