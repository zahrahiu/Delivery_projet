package org.delivery.users_service.Controller;


import org.delivery.users_service.DTO.UserRequestDTO;
import org.delivery.users_service.DTO.UserResponseDTO;
import org.delivery.users_service.service.UserProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profiles")
public class UserProfileController {


    private final UserProfileService profileService;

    public UserProfileController(UserProfileService profileService) {
        this.profileService = profileService;
    }

    @PostMapping
    public ResponseEntity<UserResponseDTO> create(@RequestBody UserRequestDTO request) {
        return ResponseEntity.ok(profileService.createUserProfile(request));
    }

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAll() {
        return ResponseEntity.ok(profileService.getAllProfiles());
    }
}