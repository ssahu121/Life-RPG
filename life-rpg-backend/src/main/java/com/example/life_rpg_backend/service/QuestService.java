package com.example.life_rpg_backend.service;

import com.example.life_rpg_backend.entity.Quest;
import com.example.life_rpg_backend.entity.User;
import com.example.life_rpg_backend.repository.QuestRepository;
import com.example.life_rpg_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuestService {

    private final QuestRepository questRepository;
    private final UserRepository userRepository;
    private final XpService xpService;

    public QuestService(
            QuestRepository questRepository,
            UserRepository userRepository,
            XpService xpService
    ) {
        this.questRepository = questRepository;
        this.userRepository = userRepository;
        this.xpService = xpService;
    }

    public Quest createQuest(
            Long userId,
            String title,
            String description,
            Integer xp
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (title == null || title.trim().isEmpty()) {
            throw new RuntimeException("Quest title is required");
        }

        if (xp == null || xp <= 0) {
            throw new RuntimeException("XP must be greater than 0");
        }

        Quest quest = new Quest();

        quest.setTitle(title.trim());
        quest.setDescription(
                description == null ? "" : description.trim()
        );
        quest.setXp(xp);
        quest.setCompleted(false);
        quest.setUser(user);

        return questRepository.save(quest);
    }

    public List<Quest> getUserQuests(Long userId) {
        return questRepository.findByUserId(userId);
    }

    public Quest getQuest(Long userId, Long questId) {
        return questRepository
                .findByIdAndUserId(questId, userId)
                .orElseThrow(
                        () -> new RuntimeException("Quest not found")
                );
    }

    public Quest updateQuest(
            Long userId,
            Long questId,
            String title,
            String description,
            Integer xp
    ) {
        Quest quest = getQuest(userId, questId);

        if (title == null || title.trim().isEmpty()) {
            throw new RuntimeException("Quest title is required");
        }

        if (xp == null || xp <= 0) {
            throw new RuntimeException("XP must be greater than 0");
        }

        quest.setTitle(title.trim());

        quest.setDescription(
                description == null ? "" : description.trim()
        );

        quest.setXp(xp);

        return questRepository.save(quest);
    }

    public Quest completeQuest(
            Long userId,
            Long questId
    ) {

        Quest quest = getQuest(userId, questId);

        // Prevent duplicate XP
        if (Boolean.TRUE.equals(quest.getCompleted())) {
            throw new RuntimeException(
                    "Quest already completed"
            );
        }

        User user = quest.getUser();

        // Mark quest completed
        quest.setCompleted(true);

        // Add XP and calculate new level
        xpService.addXp(
                user,
                quest.getXp()
        );

        // Save updated user XP/level
        userRepository.save(user);

        // Save completed quest
        return questRepository.save(quest);
    }

    public void deleteQuest(
            Long userId,
            Long questId
    ) {
        Quest quest = getQuest(userId, questId);

        questRepository.delete(quest);
    }
}