package com.epms.service;

import com.epms.dto.TaskDto;
import com.epms.dto.TaskProgressRequest;
import com.epms.entity.*;
import com.epms.exception.ResourceNotFoundException;
import com.epms.repository.EmployeeRepository;
import com.epms.repository.ProjectRepository;
import com.epms.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    public List<TaskDto> getAllTasks(String query, TaskStatus status, TaskPriority priority, Long employeeId, Long projectId) {
        List<Task> tasks = taskRepository.filterTasks(query, status, priority, employeeId, projectId);
        return tasks.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public TaskDto getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return mapToDto(task);
    }

    @Transactional
    public TaskDto createTask(TaskDto dto) {
        Employee employee = employeeRepository.findById(dto.getAssignedEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Assigned employee not found with id: " + dto.getAssignedEmployeeId()));

        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + dto.getProjectId()));

        Task task = Task.builder()
                .taskTitle(dto.getTaskTitle())
                .description(dto.getDescription())
                .assignedEmployee(employee)
                .project(project)
                .priority(dto.getPriority() != null ? dto.getPriority() : TaskPriority.MEDIUM)
                .status(dto.getStatus() != null ? dto.getStatus() : TaskStatus.TODO)
                .dueDate(dto.getDueDate())
                .progressPercentage(dto.getProgressPercentage() != null ? dto.getProgressPercentage() : 0)
                .remarks(dto.getRemarks())
                .build();

        Task saved = taskRepository.save(task);

        // Send Email Notification to assigned employee
        emailService.sendTaskAssignmentEmail(saved, employee);
        syncParentProjectStatus(saved.getProject());

        auditLogService.logAction(null, null, "Create Task", "Task", "Created task: " + saved.getTaskTitle());

        return mapToDto(saved);
    }

    @Transactional
    public TaskDto updateTask(Long id, TaskDto dto) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        TaskStatus oldStatus = task.getStatus();

        Employee employee = employeeRepository.findById(dto.getAssignedEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Assigned employee not found with id: " + dto.getAssignedEmployeeId()));

        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + dto.getProjectId()));

        task.setTaskTitle(dto.getTaskTitle());
        task.setDescription(dto.getDescription());
        task.setAssignedEmployee(employee);
        task.setProject(project);
        task.setPriority(dto.getPriority());
        task.setStatus(dto.getStatus());
        task.setDueDate(dto.getDueDate());

        if (dto.getProgressPercentage() != null) {
            task.setProgressPercentage(dto.getProgressPercentage());
            if (dto.getProgressPercentage() == 100) {
                task.setStatus(TaskStatus.COMPLETED);
            }
        }
        if (dto.getRemarks() != null) {
            task.setRemarks(dto.getRemarks());
        }

        Task updated = taskRepository.save(task);

        if (oldStatus != updated.getStatus()) {
            emailService.sendTaskStatusUpdateEmail(updated, employee);
            auditLogService.logAction(null, null, "Change Status", "Task", "Changed task status from " + oldStatus + " to " + updated.getStatus() + " for task: " + updated.getTaskTitle());
        } else {
            auditLogService.logAction(null, null, "Update Task", "Task", "Updated task: " + updated.getTaskTitle());
        }

        syncParentProjectStatus(updated.getProject());

        return mapToDto(updated);
    }

    @Transactional
    public TaskDto updateTaskProgress(Long id, TaskProgressRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        TaskStatus oldStatus = task.getStatus();

        task.setProgressPercentage(request.getProgressPercentage());
        task.setStatus(request.getStatus());

        if (request.getProgressPercentage() == 100) {
            task.setStatus(TaskStatus.COMPLETED);
        }

        if (request.getRemarks() != null && !request.getRemarks().isBlank()) {
            task.setRemarks(request.getRemarks());
        }

        Task updated = taskRepository.save(task);

        if (oldStatus != updated.getStatus()) {
            emailService.sendTaskStatusUpdateEmail(updated, task.getAssignedEmployee());
            auditLogService.logAction(null, null, "Change Status", "Task", "Changed task status from " + oldStatus + " to " + updated.getStatus() + " for task: " + updated.getTaskTitle());
        }

        auditLogService.logAction(null, null, "Update Progress", "Task", "Updated task progress to " + updated.getProgressPercentage() + "% for task: " + updated.getTaskTitle());

        syncParentProjectStatus(updated.getProject());

        return mapToDto(updated);
    }

    private void syncParentProjectStatus(Project project) {
        if (project == null || project.getId() == null) return;
        List<Task> projectTasks = taskRepository.findByProjectId(project.getId());
        if (projectTasks.isEmpty()) return;

        boolean allCompleted = projectTasks.stream().allMatch(t -> t.getStatus() == TaskStatus.COMPLETED);
        boolean anyInProgressOrDone = projectTasks.stream().anyMatch(t -> t.getStatus() == TaskStatus.IN_PROGRESS || t.getStatus() == TaskStatus.COMPLETED);

        if (allCompleted && project.getStatus() != ProjectStatus.COMPLETED) {
            project.setStatus(ProjectStatus.COMPLETED);
            Project savedProject = projectRepository.save(project);
            emailService.sendProjectCompletedEmail(savedProject, savedProject.getAssignedEmployees());
        } else if (anyInProgressOrDone && project.getStatus() == ProjectStatus.NOT_STARTED) {
            project.setStatus(ProjectStatus.IN_PROGRESS);
            projectRepository.save(project);
        }
    }

    @Transactional
    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("Task not found with id: " + id);
        }
        taskRepository.deleteById(id);
        auditLogService.logAction(null, null, "Delete Task", "Task", "Deleted task with ID: " + id);
    }

    public TaskDto mapToDto(Task task) {
        return TaskDto.builder()
                .id(task.getId())
                .taskTitle(task.getTaskTitle())
                .description(task.getDescription())
                .assignedEmployeeId(task.getAssignedEmployee() != null ? task.getAssignedEmployee().getId() : null)
                .assignedEmployeeName(task.getAssignedEmployee() != null ? task.getAssignedEmployee().getName() : "Unassigned")
                .projectId(task.getProject() != null ? task.getProject().getId() : null)
                .projectName(task.getProject() != null ? task.getProject().getProjectName() : "Unassigned")
                .priority(task.getPriority())
                .status(task.getStatus())
                .dueDate(task.getDueDate())
                .progressPercentage(task.getProgressPercentage() != null ? task.getProgressPercentage() : 0)
                .remarks(task.getRemarks())
                .build();
    }
}
