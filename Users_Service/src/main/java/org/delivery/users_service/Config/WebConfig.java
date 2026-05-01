package org.delivery.users_service.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${upload.directory:Users_Service/uploads/}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // الحصول على المسار المطلق للمشروع
        String projectPath = System.getProperty("user.dir");
        Path uploadPath = Paths.get(projectPath, uploadDir);
        String absolutePath = uploadPath.toAbsolutePath().toString();

        // التأكد من وجود الشرطة في النهاية
        String location = "file:" + absolutePath + (absolutePath.endsWith("/") || absolutePath.endsWith("\\") ? "" : "/");

        System.out.println("========================================");
        System.out.println("📁 Project path: " + projectPath);
        System.out.println("📁 Upload directory: " + uploadDir);
        System.out.println("📁 Absolute path: " + absolutePath);
        System.out.println("📁 Serving images from: " + location);
        System.out.println("========================================");

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location)
                .setCachePeriod(3600)
                .resourceChain(true);
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