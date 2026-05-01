package org.gym.service_security.repository;

import org.gym.service_security.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
    //boolean existsByEmail(String email);

    // أضف هاد السطر فـ الـ interface
    List<User> findByActiveFalse();
}
