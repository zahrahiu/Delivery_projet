package org.gym.service_security.controllers;


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
import org.springframework.security.core.context.SecurityContextHolder;
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

@Tag(name = "Users", description = "API pour la gestion des utilisateurs")
@RestController
@RequestMapping("/v1/users")
@Tag(name = "Users", description = "API pour la gestion des utilisateurs")
public class UserController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper; // Injecter ton mapper

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

    // --- CREATE USER ---
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/create")
    public ResponseEntity<UserResponseDTO> createUser(@RequestBody UserRequestDTO request) {
        UserResponseDTO response = userService.createUser(request);

        if (!response.isActive()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // --- GET USER BY ID ---
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Integer id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // --- GET ALL USERS ---
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers(@AuthenticationPrincipal Jwt jwt) {
        List<UserResponseDTO> users = userService.getAllUsers();
        List<String> roles = jwt.getClaim("roles");

        if (roles.contains("ADMIN")) return ResponseEntity.ok(users);

        if (roles.contains("MANAGER")) {
            List<String> internalRoles = List.of("HOUSEKEEPING", "RECEPTIONNISTE", "MAINTENANCE", "COMPTABLE", "MANAGER");
            List<UserResponseDTO> filteredUsers = users.stream()
                    .filter(u -> u.getRoles().stream().anyMatch(internalRoles::contains))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(filteredUsers);
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    // --- DELETE USER ---
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Integer id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("Utilisateur supprimé avec succès");
    }

    // --- ASSIGN ROLE ---
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{userId}/roles")
    public ResponseEntity<UserResponseDTO> assignRoleToUser(@PathVariable Integer userId, @RequestParam String roleName) {
        return ResponseEntity.ok(userService.assignRoleToUser(userId, roleName));
    }

    // --- UPDATE USER STATUS ---
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponseDTO> updateUserStatus(@PathVariable Integer id, @RequestBody Map<String, Boolean> request) {
        Boolean active = request.get("active");
        if (active == null) return ResponseEntity.badRequest().build();

        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setActive(active);
        User updatedUser = userRepository.save(user);

        UserResponseDTO response = userMapper.Entity_to_DTO(updatedUser);
        return ResponseEntity.ok(response);
    }

    // --- REGISTER CLIENT ---
    @PostMapping("/register")
    public ResponseEntity<UserResponseDTO> registerUserClient(@Valid @RequestBody UserRequestDTO request) {
        request.setRole(Set.of("CLIENT"));
        UserResponseDTO response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // --- LOGIN ---
    @PostMapping("/login")
    public ResponseEntity<UserResponseDTO> login(@RequestBody UserRequestDTO request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
            Set<String> permissions = user.getRoles().stream()
                    .flatMap(r -> r.getPermissions().stream())
                    .map(PermissionEntity::getName).collect(Collectors.toSet());

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
                    .claim("prenom", user.getFirstName())
                    .claim("nom", user.getLastName())
                    .claim("userId", user.getId())
                    .claim("roles", roles)
                    .claim("permissions", permissions)
                    .claim("type", "access")
                    .build();

            String accessToken = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

            UserResponseDTO response = new UserResponseDTO();
            response.setId(user.getId());
            response.setEmail(user.getEmail());
            response.setFirstName(user.getFirstName());
            response.setLastName(user.getLastName());
            response.setActive(user.isActive());
            response.setRoles(roles);
            response.setAccessToken(accessToken);
            response.setRefreshToken(refreshToken.getToken());
            response.setTokenType("Bearer");
            response.setTokenExpiresIn(3600);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    // --- REFRESH TOKEN ---
    @PostMapping("/refresh")
    public ResponseEntity<UserResponseDTO> refresh(@RequestBody RefreshTokenRequestDTO request) {
        try {
            RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(request.getRefreshToken());
            User user = refreshToken.getUser();
            if (!user.isActive()) {
                refreshTokenService.revokeRefreshToken(refreshToken.getToken());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
            Set<String> permissions = user.getRoles().stream()
                    .flatMap(r -> r.getPermissions().stream())
                    .map(PermissionEntity::getName).collect(Collectors.toSet());

            Instant now = Instant.now();
            JwtClaimsSet claims = JwtClaimsSet.builder()
                    .issuer("microservice-security")
                    .issuedAt(now)
                    .expiresAt(now.plus(1, ChronoUnit.HOURS))
                    .subject(user.getEmail())
                    .claim("email", user.getEmail())
                    .claim("userId", user.getId())
                    .claim("prenom", user.getFirstName())
                    .claim("nom", user.getLastName())
                    .claim("roles", roles)
                    .claim("permissions", permissions)
                    .claim("type", "access")
                    .build();

            String newAccessToken = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
            RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getId());
            refreshTokenService.revokeRefreshToken(refreshToken.getToken());

            UserResponseDTO response = new UserResponseDTO();
            response.setId(user.getId());
            response.setEmail(user.getEmail());
            response.setFirstName(user.getFirstName());
            response.setLastName(user.getLastName());
            response.setActive(user.isActive());
            response.setRoles(roles);
            response.setAccessToken(newAccessToken);
            response.setRefreshToken(newRefreshToken.getToken());
            response.setTokenType("Bearer");
            response.setTokenExpiresIn(3600);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    // --- LOGOUT ---
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestBody RefreshTokenRequestDTO request) {
        try {
            refreshTokenService.revokeRefreshToken(request.getRefreshToken());
            return ResponseEntity.ok("Déconnexion réussie");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur lors de la déconnexion");
        }
    }

    // --- LOGOUT ALL ---
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/logout-all")
    public ResponseEntity<String> logoutAll(@RequestParam String email) {
        try {
            User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            refreshTokenService.revokeAllUserTokens(user.getId());
            return ResponseEntity.ok("Déconnexion de tous les appareils réussie");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur");
        }
    }

    @GetMapping("/admin/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> getAdminDashboard() {
        return ResponseEntity.ok("Welcome to Admin Dashboard");
    }

    // --- UPDATE USER ---
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable Integer id, @RequestBody UserRequestDTO request) {
        // هاد الدالة خاصك تزيديها فـ UserService
        UserResponseDTO response = userService.updateUser(id, request);
        return ResponseEntity.ok(response);
    }
}
