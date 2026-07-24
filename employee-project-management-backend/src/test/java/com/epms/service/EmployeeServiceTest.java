package com.epms.service;

import com.epms.dto.EmployeeDto;
import com.epms.entity.Employee;
import com.epms.entity.EmployeeStatus;
import com.epms.exception.BadRequestException;
import com.epms.exception.ResourceNotFoundException;
import com.epms.repository.EmployeeRepository;
import com.epms.repository.ProjectRepository;
import com.epms.repository.TaskRepository;
import com.epms.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private EmployeeService employeeService;

    private Employee sampleEmployee;
    private EmployeeDto sampleDto;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(employeeService, "entityManager", entityManager);
        sampleEmployee = Employee.builder()
                .id(1L)
                .employeeId("EMP1001")
                .firstName("Alex")
                .lastName("Johnson")
                .email("alex.johnson@company.com")
                .phone("9876543210")
                .department("Engineering")
                .role("Software Engineer")
                .status(EmployeeStatus.ACTIVE)
                .joiningDate(LocalDate.now())
                .salary(new BigDecimal("75000"))
                .age(28)
                .build();

        sampleDto = EmployeeDto.builder()
                .id(1L)
                .employeeId("EMP1001")
                .firstName("Alex")
                .lastName("Johnson")
                .email("alex.johnson@company.com")
                .phone("9876543210")
                .department("Engineering")
                .role("Software Engineer")
                .status(EmployeeStatus.ACTIVE)
                .joiningDate(LocalDate.now())
                .salary(new BigDecimal("75000"))
                .age(28)
                .build();
    }

    @Test
    void testGetAllEmployees() {
        // Arrange
        when(employeeRepository.findAll()).thenReturn(Collections.singletonList(sampleEmployee));

        // Act
        List<EmployeeDto> result = employeeService.getAllEmployees(null);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Alex Johnson", result.get(0).getName());
        verify(employeeRepository, times(1)).findAll();
    }

    @Test
    void testSearchEmployee() {
        // Arrange
        when(employeeRepository.searchEmployees("Alex")).thenReturn(Collections.singletonList(sampleEmployee));

        // Act
        List<EmployeeDto> result = employeeService.getAllEmployees("Alex");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("EMP1001", result.get(0).getEmployeeId());
        verify(employeeRepository, times(1)).searchEmployees("Alex");
    }

    @Test
    void testGetEmployeeByIdSuccessfully() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));

        // Act
        EmployeeDto result = employeeService.getEmployeeById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("alex.johnson@company.com", result.getEmail());
        verify(employeeRepository, times(1)).findById(1L);
    }

    @Test
    void testEmployeeNotFoundException() {
        // Arrange
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> employeeService.getEmployeeById(99L));
        verify(employeeRepository, times(1)).findById(99L);
    }

    @Test
    void testAddEmployeeSuccessfully() {
        // Arrange
        when(employeeRepository.existsByPhone("9876543210")).thenReturn(false);
        when(userRepository.existsByPhone("9876543210")).thenReturn(false);
        when(employeeRepository.existsByEmail("alex.johnson@company.com")).thenReturn(false);
        when(userRepository.existsByEmail("alex.johnson@company.com")).thenReturn(false);
        when(employeeRepository.existsByFirstNameIgnoreCaseAndLastNameIgnoreCase("Alex", "Johnson")).thenReturn(false);
        when(userRepository.existsByFirstNameIgnoreCaseAndLastNameIgnoreCase("Alex", "Johnson")).thenReturn(false);

        when(employeeRepository.save(any(Employee.class))).thenReturn(sampleEmployee);

        // Act
        EmployeeDto result = employeeService.createEmployee(sampleDto);

        // Assert
        assertNotNull(result);
        assertEquals("Alex Johnson", result.getName());
        verify(employeeRepository, times(1)).save(any(Employee.class));
        verify(emailService, times(1)).sendWelcomeEmail(any(Employee.class));
    }

    @Test
    void testAddEmployeeDuplicateEmail() {
        // Arrange
        when(employeeRepository.existsByEmail("alex.johnson@company.com")).thenReturn(true);

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () -> employeeService.createEmployee(sampleDto));
        assertTrue(exception.getMessage().contains("DUPLICATE_EMAIL"));
        verify(employeeRepository, never()).save(any());
    }

    @Test
    void testAddEmployeeDuplicatePhone() {
        // Arrange
        when(employeeRepository.existsByPhone("9876543210")).thenReturn(true);

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () -> employeeService.createEmployee(sampleDto));
        assertTrue(exception.getMessage().contains("DUPLICATE_PHONE"));
        verify(employeeRepository, never()).save(any());
    }

    @Test
    void testAddEmployeeInvalidPhoneFormat() {
        // Arrange
        sampleDto.setPhone("123");
        when(employeeRepository.existsByPhone("123")).thenReturn(true);

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () -> employeeService.createEmployee(sampleDto));
        assertTrue(exception.getMessage().contains("DUPLICATE_PHONE"));
        verify(employeeRepository, never()).save(any());
    }

    @Test
    void testUpdateEmployeeSuccessfully() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
        when(employeeRepository.save(any(Employee.class))).thenReturn(sampleEmployee);

        sampleDto.setDepartment("Product");

        // Act
        EmployeeDto result = employeeService.updateEmployee(1L, sampleDto);

        // Assert
        assertNotNull(result);
        verify(employeeRepository, times(1)).save(sampleEmployee);
    }

    @Test
    void testUpdateEmployeeNotFound() {
        // Arrange
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> employeeService.updateEmployee(99L, sampleDto));
        verify(employeeRepository, never()).save(any());
    }

    @Test
    void testDeleteEmployeeSuccessfully() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
        when(taskRepository.findByAssignedEmployeeId(1L)).thenReturn(Collections.emptyList());
        when(projectRepository.findAll()).thenReturn(Collections.emptyList());

        Query query = mock(Query.class);
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);

        // Act
        employeeService.deleteEmployee(1L);

        // Assert
        verify(employeeRepository, times(1)).delete(sampleEmployee);
    }
}
