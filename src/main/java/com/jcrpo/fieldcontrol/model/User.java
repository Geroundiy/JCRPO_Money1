package com.jcrpo.fieldcontrol.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
// I have reverted the table name to 'users' to match your database schema.
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;
}

