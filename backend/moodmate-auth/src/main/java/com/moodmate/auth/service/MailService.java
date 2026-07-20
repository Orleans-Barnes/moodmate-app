package com.moodmate.auth.service;

import com.moodmate.auth.config.PasswordResetProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Thin wrapper around JavaMailSender so AuthService doesn't need to know about Gmail SMTP
 * specifics. Send failures are caught by the caller (AuthService.forgotPassword) - this method
 * lets MailException propagate so the caller can decide whether to log-and-swallow (to avoid
 * leaking "this email doesn't exist" vs. "mail server is down" as distinguishable behavior).
 */
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;
    private final PasswordResetProperties properties;

    public void sendPasswordResetOtp(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.fromAddress());
        message.setTo(toEmail);
        message.setSubject("MoodMate password reset code");
        message.setText(
                "Your MoodMate password reset code is: " + otp + "\n\n" +
                "This code expires in " + properties.otpExpiryMinutes() + " minutes. " +
                "If you didn't request this, you can safely ignore this email."
        );
        mailSender.send(message);
    }
}
