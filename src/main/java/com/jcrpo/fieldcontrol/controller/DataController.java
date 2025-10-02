package com.jcrpo.fieldcontrol.controller;

import com.jcrpo.fieldcontrol.model.Goal;
import com.jcrpo.fieldcontrol.model.Transaction;
import com.jcrpo.fieldcontrol.model.User;
import com.jcrpo.fieldcontrol.repository.UserRepository;
import com.jcrpo.fieldcontrol.service.DataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.time.LocalDateTime; // <-- Импортируем LocalDateTime
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/data")
@RequiredArgsConstructor
public class DataController {

    private final DataService dataService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getUserData(Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        Map<String, Object> userData = new HashMap<>();
        userData.put("goal", dataService.getGoal(user).orElse(null));
        userData.put("transactions", dataService.getAllUserTransactions(user));
        return ResponseEntity.ok(userData);
    }

    @PostMapping("/goal")
    public ResponseEntity<Goal> saveGoal(@RequestBody Goal goal, Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        return ResponseEntity.ok(dataService.saveGoal(goal, user));
    }

    // НОВЫЙ МЕТОД для удаления цели
    @DeleteMapping("/goal")
    public ResponseEntity<Void> deleteGoal(Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        dataService.deleteGoalAndTransactions(user); // Теперь этот метод существует
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/transaction")
    public ResponseEntity<Transaction> saveTransaction(@RequestBody Transaction transaction, Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        transaction.setDate(LocalDate.now());
        transaction.setTimestamp(LocalDateTime.now()); // Теперь этот метод существует
        return ResponseEntity.ok(dataService.saveTransaction(transaction, user));
    }

    private User getUserFromAuthentication(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated.");
        }
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found in database."));
    }
}