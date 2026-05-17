package com.hackathon.api;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HackathonApiApplication {

    public static void main(String[] args) {
        normalizeRenderDatabaseUrl();
        SpringApplication.run(HackathonApiApplication.class, args);
    }

    private static void normalizeRenderDatabaseUrl() {
        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.startsWith("jdbc:")) {
            return;
        }

        Matcher matcher = Pattern.compile("^postgres(?:ql)?://([^:]+):([^@]+)@([^/]+)/(.+)$").matcher(databaseUrl);
        if (!matcher.matches()) {
            return;
        }

        System.setProperty("spring.datasource.url", "jdbc:postgresql://" + matcher.group(3) + "/" + matcher.group(4));
        System.setProperty("spring.datasource.username", matcher.group(1));
        System.setProperty("spring.datasource.password", matcher.group(2));
    }
}
