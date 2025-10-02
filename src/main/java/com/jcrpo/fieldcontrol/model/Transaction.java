package com.jcrpo.fieldcontrol.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime; // <-- Импортируем LocalDateTime

@Data
@Entity
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double amount;
    private String category;
    private String description;
    private String type; // 'INCOME' or 'EXPENSE'
    private LocalDate date;
    private LocalDateTime timestamp;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;
}