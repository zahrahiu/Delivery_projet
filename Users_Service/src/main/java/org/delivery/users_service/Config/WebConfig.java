package org.delivery.users_service.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${upload.directory:Users_Service/uploads/}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String projectPath = System.getProperty("user.dir");
        String fullPath = "file:" + projectPath + "/" + uploadDir;

        if (!fullPath.endsWith("/") && !fullPath.endsWith("\\")) {
            fullPath += "/";
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(fullPath)
                .setCachePeriod(3600)
                .resourceChain(true);

        System.out.println("✅ Serving uploads from: " + fullPath);
        System.out.println("✅ Project path: " + projectPath);
        System.setProperty("spring.resources.static-locations", "file:./Users_Service/uploads/");

    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}