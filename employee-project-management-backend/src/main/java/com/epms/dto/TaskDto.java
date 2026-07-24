package com.epms.dto;

import com.epms.entity.TaskPriority;
import com.epms.entity.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDto {
    private Long id;

    @NotBlank(message = "Task title is required")
    private String taskTitle;

    private String description;

    @NotNull(message = "Assigned employee is required")
    private Long assignedEmployeeId;
    private String assignedEmployeeName;

    @NotNull(message = "Project is required")
    private Long projectId;
    private String projectName;

    @NotNull(message = "Task priority is required")
    private TaskPriority priority;

    @NotNull(message = "Task status is required")
    private TaskStatus status;

    private LocalDate dueDate;

    private Integer progressPercentage;

    private String remarks;
}
