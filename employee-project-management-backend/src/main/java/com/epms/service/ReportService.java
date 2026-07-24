package com.epms.service;

import com.epms.dto.ProjectDto;
import com.epms.dto.TaskDto;
import com.epms.entity.Employee;
import com.epms.entity.Task;
import com.epms.entity.TaskStatus;
import com.epms.repository.EmployeeRepository;
import com.epms.repository.ProjectRepository;
import com.epms.repository.TaskRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TaskService taskService;
    private final ProjectService projectService;

    @Data
    @Builder
    public static class EmployeeTaskReport {
        private Long employeeId;
        private String employeeName;
        private String department;
        private long totalTasks;
        private long completedTasks;
        private long pendingTasks;
        private double completionRate; // (Completed / Total) * 100
    }

    public List<EmployeeTaskReport> getEmployeeTaskReport() {
        List<Employee> employees = employeeRepository.findAll();
        List<EmployeeTaskReport> reports = new ArrayList<>();

        for (Employee emp : employees) {
            long total = taskRepository.countByAssignedEmployeeId(emp.getId());
            long completed = taskRepository.countByAssignedEmployeeIdAndStatus(emp.getId(), TaskStatus.COMPLETED);
            long pending = total - completed;
            double rate = total > 0 ? Math.round(((double) completed / total) * 1000.0) / 10.0 : 0.0;

            reports.add(EmployeeTaskReport.builder()
                    .employeeId(emp.getId())
                    .employeeName(emp.getName())
                    .department(emp.getDepartment())
                    .totalTasks(total)
                    .completedTasks(completed)
                    .pendingTasks(pending)
                    .completionRate(rate)
                    .build());
        }

        return reports;
    }

    public List<ProjectDto> getProjectProgressReport() {
        return projectRepository.findAll().stream()
                .map(projectService::mapToDto)
                .collect(Collectors.toList());
    }

    public List<TaskDto> getPendingTaskReport() {
        return taskRepository.findByStatusNot(TaskStatus.COMPLETED).stream()
                .map(taskService::mapToDto)
                .collect(Collectors.toList());
    }

    public List<TaskDto> getCompletedTaskReport() {
        return taskRepository.findByStatus(TaskStatus.COMPLETED).stream()
                .map(taskService::mapToDto)
                .collect(Collectors.toList());
    }
}
