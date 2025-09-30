package com.jcrpo.fieldcontrol.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDate;

@Data
@Entity
public class Goal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private double amount;
    private LocalDate date; // Deadline

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;
}