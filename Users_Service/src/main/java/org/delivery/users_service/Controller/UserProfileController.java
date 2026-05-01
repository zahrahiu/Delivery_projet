package org.delivery.users_service.Controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.delivery.users_service.DTO.UserRequestDTO;
import org.delivery.users_service.DTO.UserResponseDTO;
import org.delivery.users_service.service.UserProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "User Profiles", description = "API pour la gestion des profils de la plateforme de livraison (Qrib Lik)")
@RestController
@RequestMapping("/api/profiles")
public class UserProfileController {

    private final UserProfileService profileService;

    public UserProfileController(UserProfileService profileService) {
        this.profileService = profileService;
    }

    @Operation(
            summary = "Créer un nouveau profil utilisateur",
            description = "Permet d'enregistrer un nouveau profil (Client ou Livreur) dans le système"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Profil créé avec succès"),
            @ApiResponse(responseCode = "400", description = "Données d'entrée invalides"),
            @ApiResponse(responseCode = "409", description = "Email déjà utilisé")
    })
    @PostMapping
    public ResponseEntity<?> create(@RequestBody UserRequestDTO request) {
        System.out.println("DEBUG: Entering CREATE method for email: " + request.getEmail());
        try {
            UserResponseDTO response = profileService.createUserProfile(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            String message = e.getMessage();
            Map<String, String> errorResponse = new HashMap<>();
            if (message != null && message.contains("EMAIL_ALREADY_EXISTS")) {
                errorResponse.put("message", "Cet email est déjà utilisé");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
            }
            errorResponse.put("message", message != null ? message : "Une erreur est survenue");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    // 🔥 Modification: Two separate endpoints for update
    // 1. Update with image (multipart)
    @PutMapping(value = "/{id}/with-image", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<?> updateWithImage(
            @PathVariable Integer id,
            @ModelAttribute UserRequestDTO request,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            UserResponseDTO response = profileService.updateUserProfile(id, request, file);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    // 2. Update without image (JSON only) - 🔥 هاد هو اللي محتاجينو
    @PutMapping(value = "/{id}", consumes = {MediaType.APPLICATION_JSON_VALUE})
    @PreAuthorize("#id == authentication.principal.userId or hasRole('ADMIN')")

    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody UserRequestDTO request) {
        System.out.println("DEBUG: Updating profile for ID: " + id);
        try {
            UserResponseDTO response = profileService.updateUserProfile(id, request, null);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Une erreur est survenue lors de la mise à jour");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @Operation(
            summary = "Lister tous les profils",
            description = "Retourne la liste complète de tous les profils enregistrés dans le système"
    )
    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAll() {
        return ResponseEntity.ok(profileService.getAllProfiles());
    }

    @GetMapping("/details/{id}")
    public ResponseEntity<?> getDetails(@PathVariable Integer id) {
        try {
            UserResponseDTO response = profileService.getUserProfile(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        try {
            profileService.deleteProfile(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    @GetMapping("/drivers/zone/{zoneId}")
    public ResponseEntity<List<UserResponseDTO>> getDriversByZone(@PathVariable String zoneId) {
        return ResponseEntity.ok(profileService.getDriversByZone(zoneId));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<?> activateAccount(@PathVariable Integer id) {
        try {
            UserResponseDTO response = profileService.activateUser(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }
}