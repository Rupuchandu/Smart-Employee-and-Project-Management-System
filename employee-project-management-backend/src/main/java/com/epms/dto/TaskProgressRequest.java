package com.epms.dto;

import com.epms.entity.TaskStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TaskProgressRequest {

    @NotNull(message = "Progress percentage is required")
    @Min(value = 0, message = "Progress percentage cannot be negative")
    @Max(value = 100, message = "Progress percentage cannot exceed 100")
    private Integer progressPercentage;

    @NotNull(message = "Task status is required")
    private TaskStatus status;

    private String remarks;
}
