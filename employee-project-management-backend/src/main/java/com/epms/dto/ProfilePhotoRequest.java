package com.epms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProfilePhotoRequest {
    @NotBlank(message = "Profile photo data is required")
    private String photo;
}
