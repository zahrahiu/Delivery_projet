package org.delivery.users_service.repository;

import org.delivery.users_service.entities.RoleType;
import org.delivery.users_service.entities.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserProfile, Integer> {
    boolean existsByCni(String cni);
    List<UserProfile> findByRole(RoleType role);
    Optional<UserProfile> findByEmail(String email);  // Retourner Optional<User> pas UserResponseDTO
}