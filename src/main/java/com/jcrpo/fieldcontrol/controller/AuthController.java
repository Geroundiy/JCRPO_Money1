package com.jcrpo.fieldcontrol.controller;

import com.jcrpo.fieldcontrol.model.User;
import com.jcrpo.fieldcontrol.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegistrationRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username is already taken!");
        }
        User user = new User();
        user.setUsername(request.getUsername());

        user.setPassword(request.getPassword());

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully!");
    }

    @Data
    static class RegistrationRequest {
        private String username;
        private String password;
    }
}