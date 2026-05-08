package org.gym.service_security.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.gym.service_security.dto.RefreshTokenRequestDTO;
import org.gym.service_security.dto.UserRequestDTO;
import org.gym.service_security.dto.UserResponseDTO;
import org.gym.service_security.entities.PermissionEntity;
import org.gym.service_security.entities.RefreshToken;
import org.gym.service_security.entities.User;
import org.gym.service_security.entities.Role;
import org.gym.service_security.mappers.UserMapper;
import org.gym.service_security.repository.RoleRepository;
import org.gym.service_security.repository.UserRepository;
import org.gym.service_security.services.UserService;
import org.gym.service_security.services.impl.RefreshTokenService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/users")
@Tag(name = "Users", description = "API pour la gestion des utilisateurs et l'authentification")
public class UserController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public UserController(UserService userService, AuthenticationManager authenticationManager, JwtEncoder jwtEncoder,
                          UserRepository userRepository, RefreshTokenService refreshTokenService,
                          RoleRepository roleRepository, PasswordEncoder passwordEncoder, UserMapper userMapper) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.jwtEncoder = jwtEncoder;
        this.userRepository = userRepository;
        this.refreshTokenService = refreshTokenService;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    @Operation(summary = "Authentification (Login) pour obtenir les tokens")
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserRequestDTO request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (!user.isActive()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "الحساب ديالك قيد المراجعة من طرف الإدارة"));
            }

            Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());

            Instant now = Instant.now();
            String authorities = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority).collect(Collectors.joining(" "));

            JwtClaimsSet claims = JwtClaimsSet.builder()
                    .issuer("microservice-security")
                    .issuedAt(now)
                    .expiresAt(now.plus(1, ChronoUnit.HOURS))
                    .subject(authentication.getName())
                    .claim("authorities", authorities)
                    .claim("email", user.getEmail())
                    .claim("userId", user.getId())
                    .claim("roles", roles)
                    .claim("firstLogin", user.isFirstLogin())
                    .build();

            String accessToken = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

            UserResponseDTO response = userMapper.Entity_to_DTO(user);
            response.setAccessToken(accessToken);
            response.setRefreshToken(refreshToken.getToken());
            response.setTokenType("Bearer");
            response.setTokenExpiresIn(3600);
            response.setFirstLogin(user.isFirstLogin());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Email ou mot de passe incorrect"));
        }
    }

    @Operation(summary = "Inscription d'un nouveau profil (Client ou Livreur)")
    @PostMapping("/register")
    public ResponseEntity<UserResponseDTO> registerUser(@Valid @RequestBody UserRequestDTO request) {
        if (request.getRole() == null || request.getRole().isEmpty()) {
            request.setRole(Set.of("CLIENT"));
        }
        UserResponseDTO response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Mettre à jour un utilisateur")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_DISPATCHER')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> updates) {

        System.out.println("🔄 Updating user with ID: " + id);
        System.out.println("📝 Updates received: " + updates);

        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + id));

            if (updates.containsKey("firstName") && updates.get("firstName") != null) {
                user.setFirstName((String) updates.get("firstName"));
            }
            if (updates.containsKey("lastName") && updates.get("lastName") != null) {
                user.setLastName((String) updates.get("lastName"));
            }
            if (updates.containsKey("email") && updates.get("email") != null) {
                user.setEmail((String) updates.get("email"));
            }
            if (updates.containsKey("password") && updates.get("password") != null && !((String) updates.get("password")).isEmpty()) {
                user.setPassword(passwordEncoder.encode((String) updates.get("password")));
            }

            User savedUser = userRepository.save(user);
            System.out.println("✅ User updated successfully: " + savedUser.getEmail());

            return ResponseEntity.ok(userMapper.Entity_to_DTO(savedUser));

        } catch (RuntimeException e) {
            System.err.println("❌ Error updating user: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            System.err.println("❌ Unexpected error: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Une erreur est survenue lors de la mise à jour");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @Operation(summary = "Activer ou désactiver un compte utilisateur (Admin)")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponseDTO> updateUserStatus(@PathVariable Integer id, @RequestBody Map<String, Boolean> request) {
        Boolean active = request.get("active");
        System.out.println("🔄 Updating user status - ID: " + id + ", Active: " + active);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + id));

        user.setActive(active);

        // 🔥🔥🔥 Seulement les clients créés par Admin (qui ont firstLogin=false au départ)
        // ont besoin de changer leur mot de passe
        if (active) {
            boolean isClient = user.getRoles().stream().anyMatch(r -> r.getName().equals("CLIENT"));
            if (isClient && !user.isFirstLogin()) {
                // Client créé par Admin (firstLogin=false) -> a besoin de changer password
                user.setFirstLogin(true);
                System.out.println("✅ Client created by Admin, firstLogin set to true: " + user.getEmail());
            } else if (isClient) {
                // Client déjà existant (firstLogin=true) -> on garde
                user.setFirstLogin(true);
            } else {
                user.setFirstLogin(false);
            }
        }

        User savedUser = userRepository.save(user);
        System.out.println("✅ User status updated: " + savedUser.getEmail() + " -> Active: " + savedUser.isActive());

        return ResponseEntity.ok(userMapper.Entity_to_DTO(savedUser));
    }

    @Operation(summary = "Créer un utilisateur par l'Admin")
    @PostMapping("/create")
    public ResponseEntity<UserResponseDTO> createUser(@RequestBody UserRequestDTO request) {
        UserResponseDTO response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Integer id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers(@AuthenticationPrincipal Jwt jwt) {
        List<UserResponseDTO> users = userService.getAllUsers();
        List<String> roles = jwt.getClaim("roles");

        if (roles.contains("ADMIN")) return ResponseEntity.ok(users);

        if (roles.contains("MANAGER")) {
            List<String> internalRoles = List.of("HOUSEKEEPING", "RECEPTIONNISTE", "MAINTENANCE", "COMPTABLE", "MANAGER");
            return ResponseEntity.ok(users.stream()
                    .filter(u -> u.getRoles().stream().anyMatch(internalRoles::contains))
                    .collect(Collectors.toList()));
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteUser(@PathVariable Integer id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("Utilisateur supprimé avec succès");
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestBody RefreshTokenRequestDTO request) {
        try {
            refreshTokenService.revokeRefreshToken(request.getRefreshToken());
            return ResponseEntity.ok("Déconnexion réussie");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur");
        }
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponseDTO>> getPendingUsers() {
        List<User> pendingUsers = userRepository.findByActiveFalse();
        List<UserResponseDTO> response = pendingUsers.stream()
                .map(userMapper::Entity_to_DTO)
                .collect(Collectors.toList());
        System.out.println("📊 Pending users count: " + response.size());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/change-password")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CLIENT', 'ROLE_LIVREUR', 'ROLE_DISPATCHER')")
    public ResponseEntity<?> changePassword(
            @PathVariable Integer id,
            @RequestBody Map<String, String> request) {

        String newPassword = request.get("password");
        System.out.println("🔄 Changing password for user ID: " + id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + id));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setFirstLogin(false);
        User savedUser = userRepository.save(user);

        System.out.println("✅ Password changed successfully for: " + savedUser.getEmail());

        Map<String, String> response = new HashMap<>();
        response.put("message", "Mot de passe modifié avec succès");
        return ResponseEntity.ok(response);
    }
}