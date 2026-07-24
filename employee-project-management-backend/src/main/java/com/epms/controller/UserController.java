package com.epms.controller;

import com.epms.dto.ApiResponse;
import com.epms.dto.ChangePasswordRequest;
import com.epms.dto.ProfileUpdateRequest;
import com.epms.entity.User;
import com.epms.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<User>> getProfile(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.getUserProfile(email);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved", user));
    }

    @GetMapping("/pending-registrations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getPendingRegistrations() {
        List<User> pending = userService.getPendingRegistrations();
        return ResponseEntity.ok(ApiResponse.success("Pending registration requests retrieved", pending));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> approveRegistration(@PathVariable Long id) {
        User approved = userService.approveRegistration(id);
        return ResponseEntity.ok(ApiResponse.success("Employee registration approved successfully", approved));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> rejectRegistration(@PathVariable Long id) {
        User rejected = userService.rejectRegistration(id);
        return ResponseEntity.ok(ApiResponse.success("Employee registration rejected", rejected));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<User>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody ProfileUpdateRequest request) {
        String email = authentication.getName();
        User updated = userService.updateProfile(email, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        String email = authentication.getName();
        userService.changePassword(email, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    @PostMapping("/profile-photo")
    public ResponseEntity<ApiResponse<User>> uploadProfilePhoto(
            Authentication authentication,
            @Valid @RequestBody com.epms.dto.ProfilePhotoRequest request) {
        String email = authentication.getName();
        User updated = userService.uploadProfilePhoto(email, request);
        return ResponseEntity.ok(ApiResponse.success("Profile photo submitted successfully and sent to administrator for approval!", updated));
    }

    @GetMapping("/pending-photos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getPendingProfilePhotos() {
        List<User> pending = userService.getPendingProfilePhotoRequests();
        return ResponseEntity.ok(ApiResponse.success("Pending profile photo requests retrieved", pending));
    }

    @PutMapping("/{id}/approve-photo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> approveProfilePhoto(@PathVariable Long id) {
        User approved = userService.approveProfilePhoto(id);
        return ResponseEntity.ok(ApiResponse.success("Profile photo approved successfully!", approved));
    }

    @PutMapping("/{id}/reject-photo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> rejectProfilePhoto(@PathVariable Long id) {
        User rejected = userService.rejectProfilePhoto(id);
        return ResponseEntity.ok(ApiResponse.success("Profile photo request rejected.", rejected));
    }
}
