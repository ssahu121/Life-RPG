package com.example.life_rpg_backend.service;

import com.example.life_rpg_backend.entity.User;
import org.springframework.stereotype.Service;

@Service
public class XpService {

    // Non-linear XP requirement
    // Level 1 -> 100 XP
    // Level 2 -> 400 XP
    // Level 3 -> 900 XP
    // Level 4 -> 1600 XP
    // ...
    public int requiredXpForLevel(int level) {
        return 100 * level * level;
    }

    public int calculateLevel(int totalXp) {

        int level = 1;

        while (totalXp >= requiredXpForLevel(level)) {
            level++;
        }

        return level;
    }

    public boolean addXp(User user, int xp) {

        int oldLevel = user.getLevel();

        int newTotalXp = user.getTotalXp() + xp;

        int newLevel = calculateLevel(newTotalXp);

        user.setTotalXp(newTotalXp);
        user.setLevel(newLevel);

        return newLevel > oldLevel;
    }
}