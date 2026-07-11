package com.moodmate.backend.security;

import com.moodmate.backend.common.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/** Small helper so controllers don't repeat SecurityContextHolder boilerplate to find "who is calling". */
@Component
public class CurrentUser {

    public Long id() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof Long userId)) {
            throw new UnauthorizedException("No authenticated user in request context");
        }
        return userId;
    }
}
