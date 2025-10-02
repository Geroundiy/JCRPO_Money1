package com.jcrpo.fieldcontrol.service;

import com.jcrpo.fieldcontrol.model.Goal;
import com.jcrpo.fieldcontrol.model.Transaction;
import com.jcrpo.fieldcontrol.model.User;
import com.jcrpo.fieldcontrol.repository.GoalRepository;
import com.jcrpo.fieldcontrol.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // <-- НОВЫЙ ИМПОРТ

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DataService {

    private final GoalRepository goalRepository;
    private final TransactionRepository transactionRepository;

    public Goal saveGoal(Goal goal, User user) {
        goal.setUser(user);
        return goalRepository.save(goal);
    }

    public Optional<Goal> getGoal(User user) {
        return goalRepository.findByUser(user);
    }

    public Transaction saveTransaction(Transaction transaction, User user) {
        transaction.setUser(user);
        return transactionRepository.save(transaction);
    }

    public List<Transaction> getTodayExpenses(User user) {
        return transactionRepository.findByUserAndDate(user, LocalDate.now());
    }

    public List<Transaction> getAllUserTransactions(User user) {
        return transactionRepository.findByUser(user);
    }

    // НОВЫЙ МЕТОД для удаления цели и всех транзакций
    @Transactional
    public void deleteGoalAndTransactions(User user) {
        // Сначала удаляем все транзакции, связанные с пользователем
        transactionRepository.deleteAllByUser(user);
        // Затем удаляем саму цель
        goalRepository.deleteByUser(user);
    }
}