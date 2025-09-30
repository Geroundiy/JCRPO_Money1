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
import org.springframework.web.server.ResponseStatusException; // Добавляем импорт

import java.time.LocalDate;
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

    @GetMapping("/goal")
    public ResponseEntity<Goal> getUserGoal(Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        return dataService.getGoal(user)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/goal")
    public ResponseEntity<Goal> saveGoal(@RequestBody Goal goal, Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        return ResponseEntity.ok(dataService.saveGoal(goal, user));
    }

    @GetMapping("/transactions/today")
    public ResponseEntity<List<Transaction>> getTodayTransactions(Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        return ResponseEntity.ok(dataService.getTodayExpenses(user));
    }

    @PostMapping("/transaction")
    public ResponseEntity<Transaction> saveTransaction(@RequestBody Transaction transaction, Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        transaction.setDate(LocalDate.now());
        return ResponseEntity.ok(dataService.saveTransaction(transaction, user));
    }

    /**
     * Измененный метод для безопасного извлечения пользователя из контекста Spring Security.
     * Возвращает 401, если аутентификация не прошла.
     */
    private User getUserFromAuthentication(Authentication authentication) {
        // --- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: ПРОВЕРКА НА NULL ---
        if (authentication == null || !authentication.isAuthenticated()) {
            // Выбрасываем исключение, которое Spring обработает как 401 Unauthorized
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated.");
        }

        // --- ОБРАЩЕНИЕ К РЕПОЗИТОРИЮ ---
        // Теперь, когда мы уверены, что authentication не null, можно безопасно вызвать getName().
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found in database."));
    }
}