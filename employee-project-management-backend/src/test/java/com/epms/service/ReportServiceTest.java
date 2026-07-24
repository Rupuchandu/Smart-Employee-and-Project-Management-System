package com.epms.service;

import com.epms.dto.ProjectDto;
import com.epms.dto.TaskDto;
import com.epms.entity.Employee;
import com.epms.entity.Project;
import com.epms.entity.Task;
import com.epms.entity.TaskStatus;
import com.epms.repository.EmployeeRepository;
import com.epms.repository.ProjectRepository;
import com.epms.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReportServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskService taskService;

    @Mock
    private ProjectService projectService;

    @InjectMocks
    private ReportService reportService;

    private Employee sampleEmployee;
    private Project sampleProject;
    private Task sampleTask;

    @BeforeEach
    void setUp() {
        sampleEmployee = Employee.builder()
                .id(1L)
                .firstName("Michael")
                .lastName("Scott")
                .department("Management")
                .build();

        sampleProject = Project.builder()
                .id(10L)
                .projectName("Branch Expansion Project")
                .build();

        sampleTask = Task.builder()
                .id(100L)
                .taskTitle("Prepare Quarterly Sales Plan")
                .status(TaskStatus.IN_PROGRESS)
                .build();
    }

    @Test
    void testGetEmployeeTaskReportWithTasks() {
        // Arrange
        when(employeeRepository.findAll()).thenReturn(Collections.singletonList(sampleEmployee));
        when(taskRepository.countByAssignedEmployeeId(1L)).thenReturn(10L);
        when(taskRepository.countByAssignedEmployeeIdAndStatus(1L, TaskStatus.COMPLETED)).thenReturn(7L);

        // Act
        List<ReportService.EmployeeTaskReport> reports = reportService.getEmployeeTaskReport();

        // Assert
        assertNotNull(reports);
        assertEquals(1, reports.size());

        ReportService.EmployeeTaskReport report = reports.get(0);
        assertEquals(1L, report.getEmployeeId());
        assertEquals("Michael Scott", report.getEmployeeName());
        assertEquals("Management", report.getDepartment());
        assertEquals(10L, report.getTotalTasks());
        assertEquals(7L, report.getCompletedTasks());
        assertEquals(3L, report.getPendingTasks());
        assertEquals(70.0, report.getCompletionRate());

        verify(employeeRepository, times(1)).findAll();
        verify(taskRepository, times(1)).countByAssignedEmployeeId(1L);
        verify(taskRepository, times(1)).countByAssignedEmployeeIdAndStatus(1L, TaskStatus.COMPLETED);
    }

    @Test
    void testGetEmployeeTaskReportZeroTasks() {
        // Arrange
        when(employeeRepository.findAll()).thenReturn(Collections.singletonList(sampleEmployee));
        when(taskRepository.countByAssignedEmployeeId(1L)).thenReturn(0L);
        when(taskRepository.countByAssignedEmployeeIdAndStatus(1L, TaskStatus.COMPLETED)).thenReturn(0L);

        // Act
        List<ReportService.EmployeeTaskReport> reports = reportService.getEmployeeTaskReport();

        // Assert
        assertNotNull(reports);
        assertEquals(1, reports.size());

        ReportService.EmployeeTaskReport report = reports.get(0);
        assertEquals(0L, report.getTotalTasks());
        assertEquals(0L, report.getCompletedTasks());
        assertEquals(0L, report.getPendingTasks());
        assertEquals(0.0, report.getCompletionRate());
    }

    @Test
    void testCompletionPercentageCalculation() {
        // Arrange
        when(employeeRepository.findAll()).thenReturn(Collections.singletonList(sampleEmployee));
        when(taskRepository.countByAssignedEmployeeId(1L)).thenReturn(3L);
        when(taskRepository.countByAssignedEmployeeIdAndStatus(1L, TaskStatus.COMPLETED)).thenReturn(2L);

        // Act
        List<ReportService.EmployeeTaskReport> reports = reportService.getEmployeeTaskReport();

        // Assert
        assertNotNull(reports);
        assertEquals(1, reports.size());
        assertEquals(66.7, reports.get(0).getCompletionRate());
    }

    @Test
    void testGetProjectProgressReport() {
        // Arrange
        when(projectRepository.findAll()).thenReturn(Collections.singletonList(sampleProject));
        ProjectDto mockDto = ProjectDto.builder().id(10L).projectName("Branch Expansion Project").build();
        when(projectService.mapToDto(sampleProject)).thenReturn(mockDto);

        // Act
        List<ProjectDto> reports = reportService.getProjectProgressReport();

        // Assert
        assertNotNull(reports);
        assertEquals(1, reports.size());
        assertEquals("Branch Expansion Project", reports.get(0).getProjectName());
        verify(projectRepository, times(1)).findAll();
        verify(projectService, times(1)).mapToDto(sampleProject);
    }

    @Test
    void testGetPendingTaskReport() {
        // Arrange
        when(taskRepository.findByStatusNot(TaskStatus.COMPLETED)).thenReturn(Collections.singletonList(sampleTask));
        TaskDto mockDto = TaskDto.builder().id(100L).taskTitle("Prepare Quarterly Sales Plan").status(TaskStatus.IN_PROGRESS).build();
        when(taskService.mapToDto(sampleTask)).thenReturn(mockDto);

        // Act
        List<TaskDto> reports = reportService.getPendingTaskReport();

        // Assert
        assertNotNull(reports);
        assertEquals(1, reports.size());
        assertEquals(TaskStatus.IN_PROGRESS, reports.get(0).getStatus());
        verify(taskRepository, times(1)).findByStatusNot(TaskStatus.COMPLETED);
    }

    @Test
    void testGetCompletedTaskReport() {
        // Arrange
        sampleTask.setStatus(TaskStatus.COMPLETED);
        when(taskRepository.findByStatus(TaskStatus.COMPLETED)).thenReturn(Collections.singletonList(sampleTask));
        TaskDto mockDto = TaskDto.builder().id(100L).taskTitle("Prepare Quarterly Sales Plan").status(TaskStatus.COMPLETED).build();
        when(taskService.mapToDto(sampleTask)).thenReturn(mockDto);

        // Act
        List<TaskDto> reports = reportService.getCompletedTaskReport();

        // Assert
        assertNotNull(reports);
        assertEquals(1, reports.size());
        assertEquals(TaskStatus.COMPLETED, reports.get(0).getStatus());
        verify(taskRepository, times(1)).findByStatus(TaskStatus.COMPLETED);
    }
}
