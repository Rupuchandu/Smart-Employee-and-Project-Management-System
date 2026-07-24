package com.epms.dto;

import com.epms.entity.ProjectPriority;
import com.epms.entity.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDto {
    private Long id;

    @NotBlank(message = "Project name is required")
    private String projectName;

    private String description;

    @NotBlank(message = "Client name is required")
    private String client;

    private String department;

    private ProjectPriority priority;

    private LocalDate startDate;
    private LocalDate endDate;

    @NotNull(message = "Project status is required")
    private ProjectStatus status;

    private Long assignedEmployeeId;
    private String assignedEmployeeName;

    private List<Long> assignedEmployeeIds;
    private List<EmployeeDto> assignedEmployees;
}
