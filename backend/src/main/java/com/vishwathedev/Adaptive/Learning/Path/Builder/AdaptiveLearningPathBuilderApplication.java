package com.vishwathedev.Adaptive.Learning.Path.Builder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AdaptiveLearningPathBuilderApplication {

	public static void main(String[] args) {
		loadEnv();
		SpringApplication.run(AdaptiveLearningPathBuilderApplication.class, args);
	}

	private static void loadEnv() {
		String[] files = { ".env", ".env.local" };
		for (String name : files) {
			java.io.File file = new java.io.File(name);
			if (file.exists()) {
				try (java.io.BufferedReader br = new java.io.BufferedReader(new java.io.FileReader(file))) {
					String line;
					while ((line = br.readLine()) != null) {
						line = line.trim();
						if (line.isEmpty() || line.startsWith("#")) {
							continue;
						}
						int eq = line.indexOf('=');
						if (eq > 0) {
							String key = line.substring(0, eq).trim();
							String val = line.substring(eq + 1).trim();
							if (val.startsWith("\"") && val.endsWith("\"")) {
								val = val.substring(1, val.length() - 1);
							} else if (val.startsWith("'") && val.endsWith("'")) {
								val = val.substring(1, val.length() - 1);
							}
							if (!val.isEmpty()) {
								System.setProperty(key, val);
							}
						}
					}
				} catch (java.io.IOException e) {
					System.err.println("Failed to read environment file " + name + ": " + e.getMessage());
				}
			}
		}
	}
}
