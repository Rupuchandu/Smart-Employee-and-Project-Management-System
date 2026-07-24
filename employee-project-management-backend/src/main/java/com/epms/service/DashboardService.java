package com.epms.service;

import com.epms.dto.DashboardStatsDto;
import com.epms.dto.TaskDto;
import com.epms.entity.Employee;
import com.epms.entity.ProjectStatus;
import com.epms.entity.TaskStatus;
import com.epms.entity.User;
import com.epms.repository.EmployeeRepository;
import com.epms.repository.ProjectRepository;
import com.epms.repository.TaskRepository;
import com.epms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TaskService taskService;

    public DashboardStatsDto getDashboardStats(String userEmail) {
        long totalEmployees = employeeRepository.count();
        long totalProjects = projectRepository.count();
        long totalTasks = taskRepository.count();
        long activeProjects = projectRepository.countByStatus(ProjectStatus.IN_PROGRESS);
        long completedProjects = projectRepository.countByStatus(ProjectStatus.COMPLETED);

        long todoTasks = taskRepository.countByStatus(TaskStatus.TODO);
        long inProgressTasks = taskRepository.countByStatus(TaskStatus.IN_PROGRESS);
        long completedTasks = taskRepository.countByStatus(TaskStatus.COMPLETED);
        long pendingTasks = totalTasks - completedTasks;

        long myAssignedCount = 0;
        long myCompletedCount = 0;
        long myPendingCount = 0;
        List<TaskDto> upcomingDeadlines = Collections.emptyList();

        if (userEmail != null) {
            Optional<User> userOpt = userRepository.findByEmail(userEmail);
            if (userOpt.isPresent()) {
                Optional<Employee> empOpt = employeeRepository.findByEmail(userEmail);
                if (empOpt.isPresent()) {
                    Long empId = empOpt.get().getId();
                    myAssignedCount = taskRepository.countByAssignedEmployeeId(empId);
                    myCompletedCount = taskRepository.countByAssignedEmployeeIdAndStatus(empId, TaskStatus.COMPLETED);
                    myPendingCount = taskRepository.countByAssignedEmployeeIdAndStatusNot(empId, TaskStatus.COMPLETED);

                    upcomingDeadlines = taskRepository
                            .findByAssignedEmployeeIdAndDueDateGreaterThanEqualOrderByDueDateAsc(empId, LocalDate.now())
                            .stream()
                            .limit(5)
                            .map(taskService::mapToDto)
                            .collect(Collectors.toList());
                }
            }
        }

        List<TaskDto> recentTasks = taskRepository.findAll().stream()
                .limit(5)
                .map(taskService::mapToDto)
                .collect(Collectors.toList());

        return DashboardStatsDto.builder()
                .totalEmployees(totalEmployees)
                .totalProjects(totalProjects)
                .totalTasks(totalTasks)
                .activeProjects(activeProjects)
                .completedProjects(completedProjects)
                .todoTasks(todoTasks)
                .inProgressTasks(inProgressTasks)
                .completedTasks(completedTasks)
                .pendingTasks(pendingTasks)
                .myAssignedTasksCount(myAssignedCount)
                .myCompletedTasksCount(myCompletedCount)
                .myPendingTasksCount(myPendingCount)
                .upcomingDeadlines(upcomingDeadlines)
                .recentTasks(recentTasks)
                .build();
    }
}
