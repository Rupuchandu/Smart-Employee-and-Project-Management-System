package com.epms.service;

import com.epms.dto.EmployeeDto;
import com.epms.dto.ProjectDto;
import com.epms.entity.Employee;
import com.epms.entity.Project;
import com.epms.entity.ProjectPriority;
import com.epms.entity.ProjectStatus;
import com.epms.exception.ResourceNotFoundException;
import com.epms.repository.EmployeeRepository;
import com.epms.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final EmployeeRepository employeeRepository;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    public List<ProjectDto> getAllProjects(String search) {
        List<Project> projects;
        if (StringUtils.hasText(search)) {
            projects = projectRepository.searchProjects(search.trim());
        } else {
            projects = projectRepository.findAll();
        }
        return projects.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public ProjectDto getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return mapToDto(project);
    }

    @Transactional
    public ProjectDto createProject(ProjectDto dto) {
        Set<Employee> employees = new HashSet<>();

        if (dto.getAssignedEmployeeIds() != null && !dto.getAssignedEmployeeIds().isEmpty()) {
            employees.addAll(employeeRepository.findAllById(dto.getAssignedEmployeeIds()));
        } else if (dto.getAssignedEmployeeId() != null) {
            Employee emp = employeeRepository.findById(dto.getAssignedEmployeeId()).orElse(null);
            if (emp != null) employees.add(emp);
        }

        Project project = Project.builder()
                .projectName(dto.getProjectName())
                .description(dto.getDescription())
                .client(dto.getClient())
                .department(dto.getDepartment())
                .priority(dto.getPriority() != null ? dto.getPriority() : ProjectPriority.MEDIUM)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .status(dto.getStatus())
                .assignedEmployees(employees)
                .build();

        Project saved = projectRepository.save(project);

        // Send Email Notifications to Team Members
        if (!employees.isEmpty()) {
            emailService.sendProjectAssignmentEmail(saved, employees);
            auditLogService.logAction(null, null, "Assign Employees", "Project", "Assigned employees to project: " + saved.getProjectName());
        }

        auditLogService.logAction(null, null, "Create Project", "Project", "Created project: " + saved.getProjectName());

        return mapToDto(saved);
    }

    @Transactional
    public ProjectDto updateProject(Long id, ProjectDto dto) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        LocalDate oldEndDate = project.getEndDate();

        Set<Employee> employees = new HashSet<>();
        if (dto.getAssignedEmployeeIds() != null && !dto.getAssignedEmployeeIds().isEmpty()) {
            employees.addAll(employeeRepository.findAllById(dto.getAssignedEmployeeIds()));
        } else if (dto.getAssignedEmployeeId() != null) {
            Employee emp = employeeRepository.findById(dto.getAssignedEmployeeId()).orElse(null);
            if (emp != null) employees.add(emp);
        }

        ProjectStatus oldStatus = project.getStatus();

        project.setProjectName(dto.getProjectName());
        project.setDescription(dto.getDescription());
        project.setClient(dto.getClient());
        project.setDepartment(dto.getDepartment());
        if (dto.getPriority() != null) {
            project.setPriority(dto.getPriority());
        }
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        project.setStatus(dto.getStatus());
        project.setAssignedEmployees(employees);

        Project updated = projectRepository.save(project);

        // 1. Send Project Completion Email if status changed to COMPLETED
        if (updated.getStatus() == ProjectStatus.COMPLETED && oldStatus != ProjectStatus.COMPLETED) {
            emailService.sendProjectCompletedEmail(updated, employees);
        }

        // 2. Send Project Deadline Update / Upcoming Deadline Notice if deadline set or modified
        if (oldEndDate != null && dto.getEndDate() != null && !Objects.equals(oldEndDate, dto.getEndDate())) {
            emailService.sendProjectDeadlineUpdateEmail(updated, employees);
            emailService.sendProjectDeadlineUpcomingEmail(updated, employees);
        } else if (!employees.isEmpty()) {
            emailService.sendProjectAssignmentEmail(updated, employees);
        }

        auditLogService.logAction(null, null, "Update Project", "Project", "Updated project: " + updated.getProjectName());

        return mapToDto(updated);
    }

    @Transactional
    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project not found with id: " + id);
        }
        projectRepository.deleteById(id);
        auditLogService.logAction(null, null, "Delete Project", "Project", "Deleted project with ID: " + id);
    }

    public ProjectDto mapToDto(Project project) {
        List<EmployeeDto> assignedEmpDtos = project.getAssignedEmployees().stream()
                .map(e -> EmployeeDto.builder()
                        .id(e.getId())
                        .employeeId(e.getEmployeeId())
                        .name(e.getName())
                        .email(e.getEmail())
                        .department(e.getDepartment())
                        .role(e.getRole())
                        .build())
                .collect(Collectors.toList());

        List<Long> assignedEmpIds = project.getAssignedEmployees().stream()
                .map(Employee::getId)
                .collect(Collectors.toList());

        Employee lead = project.getAssignedEmployee();

        return ProjectDto.builder()
                .id(project.getId())
                .projectName(project.getProjectName())
                .description(project.getDescription())
                .client(project.getClient())
                .department(project.getDepartment())
                .priority(project.getPriority() != null ? project.getPriority() : ProjectPriority.MEDIUM)
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .status(project.getStatus())
                .assignedEmployeeId(lead != null ? lead.getId() : null)
                .assignedEmployeeName(lead != null ? lead.getName() : "Unassigned")
                .assignedEmployeeIds(assignedEmpIds)
                .assignedEmployees(assignedEmpDtos)
                .build();
    }
}
