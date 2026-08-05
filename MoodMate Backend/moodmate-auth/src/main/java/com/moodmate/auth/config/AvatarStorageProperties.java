package com.moodmate.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds moodmate.avatar.* from application.yml.
 * storageDir: absolute or relative local-disk folder avatar files are written to.
 * publicBaseUrl: the address the *frontend device* can reach this service through - must be the
 * gateway's externally-reachable base URL (same host:port as the frontend's BACKEND_BASE_URL in
 * src/config.ts), not "localhost", since the phone/emulator is a different machine than the
 * server in the normal dev setup this project uses (see current_ip.txt / check_ip.bat).
 */
@ConfigurationProperties(prefix = "moodmate.avatar")
public record AvatarStorageProperties(String storageDir, String publicBaseUrl) {}
