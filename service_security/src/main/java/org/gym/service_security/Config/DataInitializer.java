package org.gym.service_security.Config;


import org.gym.service_security.entities.Role;
import org.gym.service_security.entities.User;
import org.gym.service_security.repository.RoleRepository;
import org.gym.service_security.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {

            System.out.println("🚀 Initialisation des rôles Delivery Platform...");

            List<String> roles = Arrays.asList(
                    "ADMIN",
                    "DISPATCHER",
                    "LIVREUR",
                    "CLIENT"
            );

            // Création des rôles
            for (String roleName : roles) {
                if (roleRepository.findByName(roleName).isEmpty()) {
                    Role role = new Role();
                    role.setName(roleName);
                    role.setDescription("ROLE_" + roleName);
                    roleRepository.save(role);
                    System.out.println("✅ Rôle créé : " + roleName);
                }
            }

            // Création Admin par défaut
            if (userRepository.findByEmail("admin@delivery.com").isEmpty()) {

                User admin = new User();
                admin.setFirstName("Super");
                admin.setLastName("Admin");
                admin.setEmail("admin@delivery.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setActive(true);

                Role adminRole = roleRepository.findByName("ADMIN")
                        .orElseThrow(() -> new RuntimeException("Role ADMIN introuvable"));

                admin.getRoles().add(adminRole);

                userRepository.save(admin);

                System.out.println("👑 Admin créé: admin@delivery.com / admin123");
            }

            // Création Dispatcher test
            if (userRepository.findByEmail("dispatcher@delivery.com").isEmpty()) {

                User dispatcher = new User();
                dispatcher.setFirstName("Main");
                dispatcher.setLastName("Dispatcher");
                dispatcher.setEmail("dispatcher@delivery.com");
                dispatcher.setPassword(passwordEncoder.encode("123456"));
                dispatcher.setActive(true);

                Role dispatcherRole = roleRepository.findByName("DISPATCHER")
                        .orElseThrow(() -> new RuntimeException("Role DISPATCHER introuvable"));

                dispatcher.getRoles().add(dispatcherRole);

                userRepository.save(dispatcher);

                System.out.println("📦 Dispatcher créé");
            }

            System.out.println("✅ Initialisation terminée !");
        };
    }
}