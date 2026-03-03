package org.gym.service_security.services;


import org.gym.service_security.dto.UserRequestDTO;
import org.gym.service_security.dto.UserResponseDTO;

import java.util.List;

public interface UserService {
    UserResponseDTO createUser(UserRequestDTO request);
    UserResponseDTO getUserById(Integer id);
    List<UserResponseDTO> getAllUsers();
    void deleteUser(Integer id);
    UserResponseDTO assignRoleToUser(Integer userId, String roleName);
    UserResponseDTO updateUserStatus(Integer id, Boolean active);
}