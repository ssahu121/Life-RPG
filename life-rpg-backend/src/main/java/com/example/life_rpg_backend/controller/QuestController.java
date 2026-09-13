package com.example.life_rpg_backend.controller;

import com.example.life_rpg_backend.entity.Quest;
import com.example.life_rpg_backend.service.QuestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quests")
@CrossOrigin(origins = "http://localhost:5173")
public class QuestController {

    private final QuestService questService;

    public QuestController(QuestService questService) {
        this.questService = questService;
    }

    // =========================
    // CREATE QUEST
    // =========================

    @PostMapping
    public ResponseEntity<Quest> createQuest(
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam Integer xp,
            Authentication authentication
    ) {

        Long userId = getUserId(authentication);

        Quest quest = questService.createQuest(
                userId,
                title,
                description,
                xp
        );

        return ResponseEntity.ok(quest);
    }

    // =========================
    // GET MY QUESTS
    // =========================

    @GetMapping
    public ResponseEntity<List<Quest>> getUserQuests(
            Authentication authentication
    ) {

        Long userId = getUserId(authentication);

        return ResponseEntity.ok(
                questService.getUserQuests(userId)
        );
    }

    // =========================
    // GET ONE QUEST
    // =========================

    @GetMapping("/{questId}")
    public ResponseEntity<Quest> getQuest(
            @PathVariable Long questId,
            Authentication authentication
    ) {

        Long userId = getUserId(authentication);

        return ResponseEntity.ok(
                questService.getQuest(
                        userId,
                        questId
                )
        );
    }

    // =========================
    // UPDATE QUEST
    // =========================

    @PutMapping("/{questId}")
    public ResponseEntity<Quest> updateQuest(
            @PathVariable Long questId,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam Integer xp,
            Authentication authentication
    ) {

        Long userId = getUserId(authentication);

        return ResponseEntity.ok(
                questService.updateQuest(
                        userId,
                        questId,
                        title,
                        description,
                        xp
                )
        );
    }

    // =========================
    // COMPLETE QUEST
    // =========================

    @PutMapping("/{questId}/complete")
    public ResponseEntity<Quest> completeQuest(
            @PathVariable Long questId,
            Authentication authentication
    ) {

        Long userId = getUserId(authentication);

        return ResponseEntity.ok(
                questService.completeQuest(
                        userId,
                        questId
                )
        );
    }

    // =========================
    // DELETE QUEST
    // =========================

    @DeleteMapping("/{questId}")
    public ResponseEntity<String> deleteQuest(
            @PathVariable Long questId,
            Authentication authentication
    ) {

        Long userId = getUserId(authentication);

        questService.deleteQuest(
                userId,
                questId
        );

        return ResponseEntity.ok(
                "Quest deleted successfully"
        );
    }

    // =========================
    // GET USER ID FROM JWT
    // =========================

    private Long getUserId(
            Authentication authentication
    ) {

        return Long.valueOf(
                authentication.getPrincipal().toString()
        );
    }
}