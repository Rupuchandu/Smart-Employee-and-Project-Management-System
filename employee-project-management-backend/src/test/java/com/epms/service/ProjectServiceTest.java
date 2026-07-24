package com.epms.service;

import com.epms.dto.ProjectDto;
import com.epms.entity.Employee;
import com.epms.entity.Project;
import com.epms.entity.ProjectPriority;
import com.epms.entity.ProjectStatus;
import com.epms.exception.ResourceNotFoundException;
import com.epms.repository.EmployeeRepository;
import com.epms.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ProjectService projectService;

    private Project sampleProject;
    private ProjectDto sampleDto;
    private Employee sampleEmployee;

    @BeforeEach
    void setUp() {
        sampleEmployee = Employee.builder()
                .id(1L)
                .employeeId("EMP1001")
                .firstName("Sarah")
                .lastName("Connor")
                .email("sarah.connor@company.com")
                .department("Engineering")
                .role("Lead Engineer")
                .build();

        sampleProject = Project.builder()
                .id(10L)
                .projectName("AI Automation System")
                .description("Smart EPMS Enterprise Platform")
                .client("Acme Corp")
                .department("Engineering")
                .priority(ProjectPriority.HIGH)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(3))
                .status(ProjectStatus.IN_PROGRESS)
                .assignedEmployees(new HashSet<>(Collections.singletonList(sampleEmployee)))
                .build();

        sampleDto = ProjectDto.builder()
                .id(10L)
                .projectName("AI Automation System")
                .description("Smart EPMS Enterprise Platform")
                .client("Acme Corp")
                .department("Engineering")
                .priority(ProjectPriority.HIGH)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(3))
                .status(ProjectStatus.IN_PROGRESS)
                .assignedEmployeeIds(Collections.singletonList(1L))
                .build();
    }

    @Test
    void testGetAllProjects() {
        // Arrange
        when(projectRepository.findAll()).thenReturn(Collections.singletonList(sampleProject));

        // Act
        List<ProjectDto> result = projectService.getAllProjects(null);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("AI Automation System", result.get(0).getProjectName());
        verify(projectRepository, times(1)).findAll();
    }

    @Test
    void testSearchProjects() {
        // Arrange
        when(projectRepository.searchProjects("Automation")).thenReturn(Collections.singletonList(sampleProject));

        // Act
        List<ProjectDto> result = projectService.getAllProjects("Automation");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Acme Corp", result.get(0).getClient());
        verify(projectRepository, times(1)).searchProjects("Automation");
    }

    @Test
    void testFindProjectByIdSuccessfully() {
        // Arrange
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleProject));

        // Act
        ProjectDto result = projectService.getProjectById(10L);

        // Assert
        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("AI Automation System", result.getProjectName());
        verify(projectRepository, times(1)).findById(10L);
    }

    @Test
    void testFindProjectByIdNotFound() {
        // Arrange
        when(projectRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> projectService.getProjectById(99L));
        verify(projectRepository, times(1)).findById(99L);
    }

    @Test
    void testCreateProjectSuccessfully() {
        // Arrange
        when(employeeRepository.findAllById(Collections.singletonList(1L))).thenReturn(Collections.singletonList(sampleEmployee));
        when(projectRepository.save(any(Project.class))).thenReturn(sampleProject);

        // Act
        ProjectDto result = projectService.createProject(sampleDto);

        // Assert
        assertNotNull(result);
        assertEquals("AI Automation System", result.getProjectName());
        verify(projectRepository, times(1)).save(any(Project.class));
        verify(emailService, times(1)).sendProjectAssignmentEmail(any(Project.class), anySet());
    }

    @Test
    void testUpdateProjectSuccessfully() {
        // Arrange
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleProject));
        when(employeeRepository.findAllById(Collections.singletonList(1L))).thenReturn(Collections.singletonList(sampleEmployee));
        when(projectRepository.save(any(Project.class))).thenReturn(sampleProject);

        // Act
        ProjectDto result = projectService.updateProject(10L, sampleDto);

        // Assert
        assertNotNull(result);
        assertEquals("AI Automation System", result.getProjectName());
        verify(projectRepository, times(1)).save(sampleProject);
    }

    @Test
    void testUpdateProjectDeadlineChanged() {
        // Arrange
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleProject));
        when(employeeRepository.findAllById(Collections.singletonList(1L))).thenReturn(Collections.singletonList(sampleEmployee));
        when(projectRepository.save(any(Project.class))).thenReturn(sampleProject);

        sampleDto.setEndDate(LocalDate.now().plusMonths(6));

        // Act
        ProjectDto result = projectService.updateProject(10L, sampleDto);

        // Assert
        assertNotNull(result);
        verify(emailService, times(1)).sendProjectDeadlineUpdateEmail(any(Project.class), anySet());
    }

    @Test
    void testDeleteProjectSuccessfully() {
        // Arrange
        when(projectRepository.existsById(10L)).thenReturn(true);

        // Act
        projectService.deleteProject(10L);

        // Assert
        verify(projectRepository, times(1)).deleteById(10L);
    }

    @Test
    void testDeleteProjectNotFound() {
        // Arrange
        when(projectRepository.existsById(99L)).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> projectService.deleteProject(99L));
        verify(projectRepository, never()).deleteById(anyLong());
    }
}
