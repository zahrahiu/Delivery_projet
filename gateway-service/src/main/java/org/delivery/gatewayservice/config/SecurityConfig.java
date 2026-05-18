package org.delivery.gatewayservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    private final RsaConfig rsaConfig;

    public SecurityConfig(RsaConfig rsaConfig) {
        this.rsaConfig = rsaConfig;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // كنسمحو لـ React (البور 3000) يقرأ البيانات
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        // configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Access-Control-Allow-Origin", "Accept"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // في Gateway - SecurityConfig.java
    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeExchange(exchanges -> exchanges
                        // OPTIONS dyal CORS
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers("/actuator/**").permitAll()
                        .pathMatchers(HttpMethod.POST, "/users-service/api/profiles/**").permitAll()
                        .pathMatchers(HttpMethod.POST, "/service-security/v1/users/register/**").permitAll()
                        .pathMatchers(HttpMethod.POST, "/service-security/v1/users/login/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/tarif-zone-service/api/zones/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/tarif-zone-service/api/tarifs/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/parcel-service/api/parcels/track/**").permitAll()                        .pathMatchers("/tarif-zone-service/api/tarifs/**").permitAll()
                        .pathMatchers("/tracking-service/ws/**").permitAll()
                        .pathMatchers(HttpMethod.PATCH, "/service-security/v1/users/*/change-password").permitAll()

                        .pathMatchers("/users-service/uploads/**").authenticated()
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
                .build();
    }

    @Bean
    public ReactiveJwtDecoder jwtDecoder() {
        return NimbusReactiveJwtDecoder.withPublicKey(rsaConfig.publicKey()).build();
    }
}