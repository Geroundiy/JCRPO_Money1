package com.jcrpo.fieldcontrol.repository;

import com.jcrpo.fieldcontrol.model.Goal;
import com.jcrpo.fieldcontrol.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, Long> {

    Optional<Goal> findByUser(User user);
    void deleteByUser(User user);
}