package com.example.life_rpg_backend.service;

import com.example.life_rpg_backend.entity.User;
import com.example.life_rpg_backend.repository.UserRepository;
import com.example.life_rpg_backend.security.JwtService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public User registerUser(
            String name,
            String email,
            String password
    ) {

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException(
                    "Email already registered"
            );
        }

        User user = new User();

        user.setName(name);
        user.setEmail(email);
        user.setPassword(
                passwordEncoder.encode(password)
        );

        return userRepository.save(user);
    }

    public String loginUser(
            String email,
            String password
    ) {

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invalid email or password"
                        )
                );

        if (!passwordEncoder.matches(
                password,
                user.getPassword()
        )) {

            throw new RuntimeException(
                    "Invalid email or password"
            );
        }

        return jwtService.generateToken(
                user.getId(),
                user.getEmail()
        );
    }
}