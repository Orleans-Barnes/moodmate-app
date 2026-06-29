package com.moodmate.backend.community;

import com.moodmate.backend.community.dto.CreatePostRequest;
import com.moodmate.backend.community.dto.PostResponse;
import com.moodmate.backend.community.dto.ReactRequest;
import com.moodmate.backend.community.dto.ReactResponse;
import com.moodmate.backend.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/community/posts")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;
    private final CurrentUser currentUser;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse create(@Valid @RequestBody CreatePostRequest request) {
        return communityService.createPost(currentUser.id(), request);
    }

    @GetMapping
    public Page<PostResponse> feed(@RequestParam(required = false) String topic,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "20") int size) {
        return communityService.feed(currentUser.id(), topic, PageRequest.of(page, size));
    }

    @PostMapping("/{id}/react")
    public ReactResponse react(@PathVariable Long id, @Valid @RequestBody ReactRequest request) {
        return communityService.react(currentUser.id(), id, request.type());
    }
}
