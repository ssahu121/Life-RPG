package com.example.life_rpg_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        System.out.println("AUTH HEADER = " + header);

        if (header != null && header.startsWith("Bearer ")) {

            String token = header.substring(7);

            System.out.println("TOKEN RECEIVED");

            try {

                if (jwtService.isValid(token)) {

                    Long userId =
                            jwtService.extractUserId(token);

                    System.out.println(
                            "JWT USER ID = " + userId
                    );

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userId,
                                    null,
                                    AuthorityUtils.NO_AUTHORITIES
                            );

                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(authentication);

                } else {

                    System.out.println("JWT INVALID");
                }

            } catch (Exception e) {

                System.out.println(
                        "JWT ERROR = " + e.getMessage()
                );
            }
        }

        filterChain.doFilter(request, response);
    }
}