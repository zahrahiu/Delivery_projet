package org.gym.service_security;

import org.gym.service_security.Config.RsaKeys;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(RsaKeys.class)
public class ServiceSecurityApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServiceSecurityApplication.class, args);
    }

}
