package org.delivery.users_service.Config;


import org.springframework.boot.context.properties.ConfigurationProperties;
import java.security.interfaces.RSAPublicKey;

@ConfigurationProperties(prefix = "rsa")
public record RsaKeys(RSAPublicKey publicKey) {}