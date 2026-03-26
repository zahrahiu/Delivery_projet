package org.delivery.users_service.service.impl;

import jakarta.transaction.Transactional;
import org.delivery.users_service.client.SecurityClient;
import org.delivery.users_service.DTO.UserRequestDTO;
import org.delivery.users_service.DTO.UserResponseDTO;
import org.delivery.users_service.entities.UserProfile;
import org.delivery.users_service.events.UserEventProducer;
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
    private final UserEventProducer userEventProducer; // 1. زيدي هاد السطر

    public UserProfileServiceImpl(
            UserRepository repository,
            SecurityClient securityClient,
            UserMapper mapper,
            PasswordEncoder passwordEncoder,
            @Value("${upload.directory:Users_Service/uploads/}") String uploadDir, UserEventProducer userEventProducer  // من application.properties
    ) {
        this.repository = repository;
        this.securityClient = securityClient;
        this.mapper = mapper;
        this.passwordEncoder = passwordEncoder;
        this.UPLOAD_DIR = uploadDir;
        this.userEventProducer = userEventProducer;

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

        Map<String, Object> eventData = new HashMap<>();
        eventData.put("email", request.getEmail());
        eventData.put("password", request.getPassword()); // الباسورد اللي غيوصل للـ Client
        eventData.put("firstName", request.getFirstName());

        userEventProducer.sendUserCreatedEvent(eventData);
        return mapper.toDTO(savedProfile);
    }

    @Override
    @Transactional
    public UserResponseDTO updateUserProfile(Integer id, UserRequestDTO request, MultipartFile file) {
        // 1. البحث عن البروفايل الأصلي
        UserProfile existingProfile = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User non trouvé ID: " + id));

        // 2. تعامل مع الصورة (هاد الجزء عندك صحيح، نقيوه شوية)
        if (file != null && !file.isEmpty()) {
            updateProfileImage(existingProfile, file);
        }

        // 3. تحضير الداتا لـ Security Service
        Map<String, Object> securityReq = new HashMap<>();
        // استعملي القيمة الجديدة من الـ request إيلا كانت موجودة، وإيلا لا خلي القديمة
        securityReq.put("firstName", request.getFirstName() != null ? request.getFirstName() : existingProfile.getFirstName());
        securityReq.put("lastName", request.getLastName() != null ? request.getLastName() : existingProfile.getLastName());
        securityReq.put("email", request.getEmail() != null ? request.getEmail() : existingProfile.getEmail());

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            securityReq.put("password", request.getPassword());
        }

        // 4. السنك مع Security Service
        try {
            // تأكدي أن existingProfile.getUserId() هو الـ ID الصحيح فـ جهة السيكوريتي
            securityClient.updateAccount(existingProfile.getUserId(), securityReq);
        } catch (Exception e) {
            throw new RuntimeException("Erreur de synchronisation avec Security Service: " + e.getMessage());
        }

        // 5. تحديث الحقول فـ Users_Service (فقط الحقول اللي ماشي null فـ request)
        if (request.getFirstName() != null) existingProfile.setFirstName(request.getFirstName());
        if (request.getLastName() != null) existingProfile.setLastName(request.getLastName());
        if (request.getEmail() != null) existingProfile.setEmail(request.getEmail());
        if (request.getPhone() != null) existingProfile.setPhone(request.getPhone());
        if (request.getZone() != null) existingProfile.setZone(request.getZone());
        if (request.getAddress() != null) existingProfile.setAddress(request.getAddress());
        if (request.getVehicleType() != null) existingProfile.setVehicleType(request.getVehicleType());
        if (request.getMatricule() != null) existingProfile.setMatricule(request.getMatricule());
        if (request.getPermisNumber() != null) existingProfile.setPermisNumber(request.getPermisNumber());

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            existingProfile.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return mapper.toDTO(repository.save(existingProfile));
    }

    // ميتود مساعدة باش يبقا الكود نقي
    private void updateProfileImage(UserProfile profile, MultipartFile file) {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (profile.getProfileImageUrl() != null) {
                Files.deleteIfExists(uploadPath.resolve(profile.getProfileImageUrl()));
            }
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            profile.setProfileImageUrl(fileName);
        } catch (IOException e) {
            throw new RuntimeException("Error saving image: " + e.getMessage());
        }
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