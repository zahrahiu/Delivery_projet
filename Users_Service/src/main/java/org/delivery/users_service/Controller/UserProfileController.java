package org.delivery.users_service.Controller;


import org.delivery.users_service.DTO.UserRequestDTO;
import org.delivery.users_service.DTO.UserResponseDTO;
import org.delivery.users_service.service.UserProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@CrossOrigin(origins = "http://localhost:3000") // Port ديال الـ React ديالك
@RestController
@RequestMapping("/api/profiles")
public class UserProfileController {


    private final UserProfileService profileService;

    public UserProfileController(UserProfileService profileService) {
        this.profileService = profileService;
    }


    @PostMapping
    public ResponseEntity<UserResponseDTO> create(@RequestBody UserRequestDTO request) {
        System.out.println("DEBUG: Entering CREATE method for email: " + request.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(profileService.createUserProfile(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> update(@PathVariable Integer id, @RequestBody UserRequestDTO request) {
        System.out.println("DEBUG: Entering UPDATE method for ID: " + id);
        return ResponseEntity.ok(profileService.updateUserProfile(id, request));
    }

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAll() {
        return ResponseEntity.ok(profileService.getAllProfiles());
    }



    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        profileService.deleteProfile(id);
        return ResponseEntity.noContent().build();
    }
}