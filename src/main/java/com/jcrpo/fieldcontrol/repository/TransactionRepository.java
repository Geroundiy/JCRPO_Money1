package com.jcrpo.fieldcontrol.repository;

import com.jcrpo.fieldcontrol.model.Transaction;
import com.jcrpo.fieldcontrol.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUser(User user);
    List<Transaction> findByUserAndDate(User user, LocalDate date);
    List<Transaction> findByTypeAndUser(String type, User user);
}