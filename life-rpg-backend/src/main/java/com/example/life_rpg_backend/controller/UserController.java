package com.example.life_rpg_backend.controller;

import com.example.life_rpg_backend.entity.User;
import com.example.life_rpg_backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getProgress(
            Authentication authentication
    ) {

        Long userId =
                Long.valueOf(authentication.getPrincipal().toString());

        User user = userRepository.findById(userId)
                .orElseThrow(
                        () -> new RuntimeException("User not found")
                );

        Map<String, Object> progress = new HashMap<>();

        progress.put("totalXp", user.getTotalXp());
        progress.put("level", user.getLevel());

        return ResponseEntity.ok(progress);
    }
}