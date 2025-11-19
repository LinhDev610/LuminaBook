package com.lumina_book.backend.configuration;

import java.time.LocalDate;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.lumina_book.backend.constant.PredefinedRole;
import com.lumina_book.backend.entity.Role;
import com.lumina_book.backend.entity.User;
import com.lumina_book.backend.repository.RoleRepository;
import com.lumina_book.backend.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ApplicationInitConfig {

    PasswordEncoder passwordEncoder;

    @NonFinal
    static final String ADMIN_EMAIL = "admin@luminabook.com";

    @NonFinal
    static final String ADMIN_PASSWORD = "admin";

    @Bean
    @ConditionalOnProperty(
            prefix = "spring",
            value = "datasource.driverClassName",
            havingValue = "com.mysql.cj.jdbc.Driver")
    ApplicationRunner applicationRunner(UserRepository userRepository, RoleRepository roleRepository) {
        log.info("Initializing  application.....");
        return args -> {
            if (userRepository.findByEmail(ADMIN_EMAIL).isEmpty()) {
                // Customer
                roleRepository.save(Role.builder()
                        .name(PredefinedRole.CUSTOMER_ROLE.getName())
                        .description(PredefinedRole.CUSTOMER_ROLE.getDescription())
                        .build());
                // Staff
                roleRepository.save(Role.builder()
                        .name(PredefinedRole.STAFF_ROLE.getName())
                        .description(PredefinedRole.STAFF_ROLE.getDescription())
                        .build());
                // Customer Support
                roleRepository.save(Role.builder()
                        .name(PredefinedRole.CS_ROLE.getName())
                        .description(PredefinedRole.CS_ROLE.getDescription())
                        .build());
                // Admin
                Role adminRole = roleRepository.save(Role.builder()
                        .name(PredefinedRole.ADMIN_ROLE.getName())
                        .description(PredefinedRole.ADMIN_ROLE.getDescription())
                        .build());

                User user = User.builder()
                        .email(ADMIN_EMAIL)
                        .password(passwordEncoder.encode(ADMIN_PASSWORD))
                        .role(adminRole)
                        .active(true)
                        .createAt(LocalDate.now())
                        .build();

                userRepository.save(user);
                log.warn("admin user has been created with default password: admin, please change it");
            }
            log.info("Application initialized completed ....");
        };
    }
}
