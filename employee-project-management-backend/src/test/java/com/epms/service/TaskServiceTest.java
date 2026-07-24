package com.epms.service;

import com.epms.dto.TaskDto;
import com.epms.dto.TaskProgressRequest;
import com.epms.entity.*;
import com.epms.exception.ResourceNotFoundException;
import com.epms.repository.EmployeeRepository;
import com.epms.repository.ProjectRepository;
import com.epms.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private TaskService taskService;

    private Task sampleTask;
    private TaskDto sampleDto;
    private Employee sampleEmployee;
    private Project sampleProject;

    @BeforeEach
    void setUp() {
        sampleEmployee = Employee.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@company.com")
                .build();

        sampleProject = Project.builder()
                .id(10L)
                .projectName("Core Dashboard Project")
                .status(ProjectStatus.NOT_STARTED)
                .build();

        sampleTask = Task.builder()
                .id(100L)
                .taskTitle("Design User Dashboard")
                .description("Create responsive layout and components")
                .assignedEmployee(sampleEmployee)
                .project(sampleProject)
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .dueDate(LocalDate.now().plusDays(7))
                .progressPercentage(0)
                .remarks("Initial draft")
                .build();

        sampleDto = TaskDto.builder()
                .id(100L)
                .taskTitle("Design User Dashboard")
                .description("Create responsive layout and components")
                .assignedEmployeeId(1L)
                .projectId(10L)
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .dueDate(LocalDate.now().plusDays(7))
                .progressPercentage(0)
                .remarks("Initial draft")
                .build();
    }

    @Test
    void testGetAllTasksFiltered() {
        // Arrange
        when(taskRepository.filterTasks(null, TaskStatus.TODO, TaskPriority.HIGH, 1L, 10L))
                .thenReturn(Collections.singletonList(sampleTask));

        // Act
        List<TaskDto> result = taskService.getAllTasks(null, TaskStatus.TODO, TaskPriority.HIGH, 1L, 10L);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Design User Dashboard", result.get(0).getTaskTitle());
        verify(taskRepository, times(1)).filterTasks(null, TaskStatus.TODO, TaskPriority.HIGH, 1L, 10L);
    }

    @Test
    void testGetTaskByIdSuccessfully() {
        // Arrange
        when(taskRepository.findById(100L)).thenReturn(Optional.of(sampleTask));

        // Act
        TaskDto result = taskService.getTaskById(100L);

        // Assert
        assertNotNull(result);
        assertEquals(100L, result.getId());
        assertEquals("Design User Dashboard", result.getTaskTitle());
        verify(taskRepository, times(1)).findById(100L);
    }

    @Test
    void testTaskNotFoundException() {
        // Arrange
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> taskService.getTaskById(999L));
        verify(taskRepository, times(1)).findById(999L);
    }

    @Test
    void testCreateTaskSuccessfully() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleProject));
        when(taskRepository.save(any(Task.class))).thenReturn(sampleTask);

        // Act
        TaskDto result = taskService.createTask(sampleDto);

        // Assert
        assertNotNull(result);
        assertEquals("Design User Dashboard", result.getTaskTitle());
        verify(taskRepository, times(1)).save(any(Task.class));
        verify(emailService, times(1)).sendTaskAssignmentEmail(any(Task.class), eq(sampleEmployee));
    }

    @Test
    void testCreateTaskAssignedEmployeeNotFound() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> taskService.createTask(sampleDto));
        verify(taskRepository, never()).save(any());
    }

    @Test
    void testCreateTaskProjectNotFound() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
        when(projectRepository.findById(10L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> taskService.createTask(sampleDto));
        verify(taskRepository, never()).save(any());
    }

    @Test
    void testUpdateTaskSuccessfully() {
        // Arrange
        when(taskRepository.findById(100L)).thenReturn(Optional.of(sampleTask));
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleProject));
        when(taskRepository.save(any(Task.class))).thenReturn(sampleTask);

        sampleDto.setStatus(TaskStatus.IN_PROGRESS);

        // Act
        TaskDto result = taskService.updateTask(100L, sampleDto);

        // Assert
        assertNotNull(result);
        verify(taskRepository, times(1)).save(sampleTask);
        verify(emailService, times(1)).sendTaskStatusUpdateEmail(any(Task.class), eq(sampleEmployee));
    }

    @Test
    void testUpdateProgressTo100Percent() {
        // Arrange
        when(taskRepository.findById(100L)).thenReturn(Optional.of(sampleTask));
        when(taskRepository.save(any(Task.class))).thenReturn(sampleTask);

        TaskProgressRequest request = new TaskProgressRequest();
        request.setProgressPercentage(100);
        request.setStatus(TaskStatus.COMPLETED);
        request.setRemarks("Fully finished component");

        // Act
        TaskDto result = taskService.updateTaskProgress(100L, request);

        // Assert
        assertNotNull(result);
        assertEquals(TaskStatus.COMPLETED, sampleTask.getStatus());
        verify(taskRepository, times(1)).save(sampleTask);
    }

    @Test
    void testDeleteTaskSuccessfully() {
        // Arrange
        when(taskRepository.existsById(100L)).thenReturn(true);

        // Act
        taskService.deleteTask(100L);

        // Assert
        verify(taskRepository, times(1)).deleteById(100L);
    }

    @Test
    void testDeleteTaskNotFound() {
        // Arrange
        when(taskRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> taskService.deleteTask(999L));
        verify(taskRepository, never()).deleteById(anyLong());
    }
}
