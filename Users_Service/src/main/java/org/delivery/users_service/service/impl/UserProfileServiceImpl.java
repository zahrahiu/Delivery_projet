package org.delivery.users_service.service.impl;

import jakarta.transaction.Transactional;
import org.delivery.users_service.client.SecurityClient;
import org.delivery.users_service.DTO.UserRequestDTO;
import org.delivery.users_service.DTO.UserResponseDTO;
import org.delivery.users_service.entities.UserProfile;
import org.delivery.users_service.mapper.UserMapper;
import org.delivery.users_service.repository.UserRepository;
import org.delivery.users_service.service.UserProfileService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@Service
@Transactional
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository repository;
    private final SecurityClient securityClient;
    private final UserMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final String UPLOAD_DIR;

    public UserProfileServiceImpl(
            UserRepository repository,
            SecurityClient securityClient,
            UserMapper mapper,
            PasswordEncoder passwordEncoder,
            @Value("${upload.directory:Users_Service/uploads/}") String uploadDir  // من application.properties
    ) {
        this.repository = repository;
        this.securityClient = securityClient;
        this.mapper = mapper;
        this.passwordEncoder = passwordEncoder;
        this.UPLOAD_DIR = uploadDir;

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("✅ Created upload directory at: " + uploadPath.toAbsolutePath());
            } else {
                System.out.println("✅ Upload directory exists at: " + uploadPath.toAbsolutePath());
            }
        } catch (IOException e) {
            System.err.println("❌ Failed to create upload directory: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public UserResponseDTO createUserProfile(UserRequestDTO request) {
        Map<String, Object> securityReq = new HashMap<>();
        securityReq.put("firstName", request.getFirstName());
        securityReq.put("lastName", request.getLastName());
        securityReq.put("email", request.getEmail());
        securityReq.put("password", request.getPassword());
        securityReq.put("role", Collections.singleton((request.getRole() != null) ? request.getRole().name() : "LIVREUR"));

        Map<String, Object> securityResponse = securityClient.createAccount(securityReq);
        Integer generatedUserId = (Integer) securityResponse.get("id");
        if (generatedUserId == null) generatedUserId = (Integer) securityResponse.get("userId");

        UserProfile profile = mapper.toEntity(request);
        profile.setUserId(generatedUserId);

        if (request.getPassword() != null) {
            profile.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        UserProfile savedProfile = repository.save(profile);
        return mapper.toDTO(savedProfile);
    }

    @Override
    @Transactional
    public UserResponseDTO updateUserProfile(Integer id, UserRequestDTO request, MultipartFile file) {
        UserProfile existingProfile = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User non trouvé ID: " + id));

        if (file != null && !file.isEmpty()) {
            try {
                Path uploadPath = Paths.get(UPLOAD_DIR);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                if (existingProfile.getProfileImageUrl() != null) {
                    Path oldFile = uploadPath.resolve(existingProfile.getProfileImageUrl());
                    Files.deleteIfExists(oldFile);
                }

                String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                existingProfile.setProfileImageUrl(fileName);
                System.out.println("✅ Image saved: " + filePath.toAbsolutePath());
            } catch (IOException e) {
                throw new RuntimeException("Error saving image: " + e.getMessage());
            }
        }

        Map<String, Object> securityReq = new HashMap<>();
        securityReq.put("firstName", request.getFirstName());
        securityReq.put("lastName", request.getLastName());
        securityReq.put("email", request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            securityReq.put("password", request.getPassword());
        }

        try {
            securityClient.updateAccount(existingProfile.getUserId(), securityReq);
        } catch (Exception e) {
            throw new RuntimeException("Erreur de synchronisation: " + e.getMessage());
        }

        existingProfile.setFirstName(request.getFirstName());
        existingProfile.setLastName(request.getLastName());
        existingProfile.setEmail(request.getEmail());
        existingProfile.setPhone(request.getPhone());
        existingProfile.setCni(request.getCni());
        existingProfile.setZone(request.getZone());
        existingProfile.setAddress(request.getAddress());
        existingProfile.setVehicleType(request.getVehicleType());
        existingProfile.setMatricule(request.getMatricule());
        existingProfile.setPermisNumber(request.getPermisNumber());
        existingProfile.setRole(request.getRole());

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            existingProfile.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return mapper.toDTO(repository.save(existingProfile));
    }

    @Override
    public UserResponseDTO getUserProfile(Integer id) {
        return mapper.toDTO(repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found ID: " + id)));
    }

    @Override
    public List<UserResponseDTO> getAllProfiles() {
        return repository.findAll().stream().map(mapper::toDTO).toList();
    }

    @Override
    public void deleteProfile(Integer id) {
        if (!repository.existsById(id)) throw new NoSuchElementException("ID introuvable");

        UserProfile profile = repository.findById(id).orElse(null);
        if (profile != null && profile.getProfileImageUrl() != null) {
            try {
                Path imagePath = Paths.get(UPLOAD_DIR).resolve(profile.getProfileImageUrl());
                Files.deleteIfExists(imagePath);
            } catch (IOException e) {
                System.err.println("Could not delete image: " + e.getMessage());
            }
        }

        repository.deleteById(id);
    }
}