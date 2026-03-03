package org.gym.service_security.repository;

import org.gym.service_security.entities.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByName(String name);
}

