package org.delivery.users_service.service;

import org.delivery.users_service.DTO.UserRequestDTO;
import org.delivery.users_service.DTO.UserResponseDTO;

import java.util.List;

public interface UserProfileService {
    UserResponseDTO createUserProfile(UserRequestDTO request);
    UserResponseDTO getUserProfile(Integer id);
    List<UserResponseDTO> getAllProfiles();
    void deleteProfile(Integer id);}