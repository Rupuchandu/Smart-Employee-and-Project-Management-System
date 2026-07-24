package com.epms.service;

import com.epms.dto.EmployeeDto;
import com.epms.entity.Employee;
import com.epms.entity.Project;
import com.epms.entity.Task;
import com.epms.exception.BadRequestException;
import com.epms.exception.ResourceNotFoundException;
import com.epms.repository.EmployeeRepository;
import com.epms.repository.ProjectRepository;
import com.epms.repository.TaskRepository;
import com.epms.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    @PersistenceContext
    private EntityManager entityManager;

    public List<EmployeeDto> getAllEmployees(String search) {
        List<Employee> employees;
        if (StringUtils.hasText(search)) {
            employees = employeeRepository.searchEmployees(search.trim());
        } else {
            employees = employeeRepository.findAll();
        }
        return employees.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public EmployeeDto getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return mapToDto(employee);
    }

    @Transactional
    public EmployeeDto createEmployee(EmployeeDto dto) {
        String email = dto.getEmail() != null ? dto.getEmail().trim().toLowerCase() : "";
        String phone = dto.getPhone() != null ? dto.getPhone().trim() : "";
        String firstName = dto.getFirstName() != null ? dto.getFirstName().trim() : "";
        String lastName = dto.getLastName() != null ? dto.getLastName().trim() : "";

        if (employeeRepository.existsByEmail(email)) {
            throw new BadRequestException("DUPLICATE_EMAIL: Employee email already exists: " + email);
        }

        if (StringUtils.hasText(phone) && employeeRepository.existsByPhone(phone)) {
            throw new BadRequestException("DUPLICATE_PHONE: Employee contact number already exists: " + phone);
        }

        if (employeeRepository.existsByFirstNameIgnoreCaseAndLastNameIgnoreCase(firstName, lastName)) {
            throw new BadRequestException("DUPLICATE_NAME: An employee with name '" + firstName + " " + lastName + "' already exists!");
        }

        String empCode = dto.getEmployeeId();
        if (!StringUtils.hasText(empCode)) {
            empCode = "EMP" + (1000 + employeeRepository.count() + 1);
        } else if (employeeRepository.existsByEmployeeId(empCode)) {
            throw new BadRequestException("DUPLICATE_EMP_ID: Employee ID already exists: " + empCode);
        }

        Employee employee = Employee.builder()
                .employeeId(empCode)
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .department(dto.getDepartment())
                .role(dto.getRole())
                .status(dto.getStatus())
                .joiningDate(dto.getJoiningDate())
                .salary(dto.getSalary())
                .age(dto.getAge())
                .build();

        Employee saved = employeeRepository.save(employee);

        // Send Welcome Email Notification
        emailService.sendWelcomeEmail(saved);

        auditLogService.logAction(null, null, "Add Employee", "Employee", "Created employee: " + saved.getName() + " (" + saved.getEmployeeId() + ")");

        return mapToDto(saved);
    }

    @Transactional
    public EmployeeDto updateEmployee(Long id, EmployeeDto dto) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        if (!employee.getEmail().equalsIgnoreCase(dto.getEmail()) && employeeRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Employee email already exists: " + dto.getEmail());
        }

        employee.setFirstName(dto.getFirstName());
        employee.setLastName(dto.getLastName());
        employee.setEmail(dto.getEmail());
        employee.setPhone(dto.getPhone());
        employee.setDepartment(dto.getDepartment());
        employee.setRole(dto.getRole());
        employee.setStatus(dto.getStatus());
        employee.setJoiningDate(dto.getJoiningDate());
        employee.setSalary(dto.getSalary());
        employee.setAge(dto.getAge());

        Employee updated = employeeRepository.save(employee);
        auditLogService.logAction(null, null, "Update Employee", "Employee", "Updated employee details for: " + updated.getName());
        return mapToDto(updated);
    }

    @Transactional
    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        try {
            // 1. Unlink foreign key references from tasks
            List<Task> assignedTasks = taskRepository.findByAssignedEmployeeId(id);
            for (Task task : assignedTasks) {
                task.setAssignedEmployee(null);
                taskRepository.save(task);
            }

            // 2. Unlink foreign key references from projects in JPA
            List<Project> allProjects = projectRepository.findAll();
            for (Project project : allProjects) {
                boolean modified = false;
                if (project.getAssignedEmployees() != null && !project.getAssignedEmployees().isEmpty()) {
                    modified = project.getAssignedEmployees().removeIf(e -> e.getId().equals(id));
                }
                if (project.getAssignedEmployee() != null && project.getAssignedEmployee().getId().equals(id)) {
                    project.setAssignedEmployee(null);
                    modified = true;
                }
                if (modified) {
                    projectRepository.save(project);
                }
            }

            // 3. Execute direct native SQL cleanup for join table project_employees and legacy projects.employee_id column
            try {
                entityManager.createNativeQuery("DELETE FROM project_employees WHERE employee_id = :empId")
                        .setParameter("empId", id)
                        .executeUpdate();
            } catch (Exception ignored) {}

            try {
                entityManager.createNativeQuery("UPDATE projects SET employee_id = NULL WHERE employee_id = :empId")
                        .setParameter("empId", id)
                        .executeUpdate();
            } catch (Exception ignored) {}

            entityManager.flush();

            // 4. Safely delete employee entity
            employeeRepository.delete(employee);
            auditLogService.logAction(null, null, "Delete Employee", "Employee", "Deleted employee: " + employee.getName() + " (" + employee.getEmployeeId() + ")");

        } catch (DataIntegrityViolationException ex) {
            throw new BadRequestException("This employee is assigned to one or more active projects or tasks. Please reassign or remove those assignments before deleting.");
        }
    }

    public EmployeeDto mapToDto(Employee employee) {
        String photo = employee.getProfilePhoto();
        com.epms.entity.PhotoStatus status = employee.getPhotoStatus();

        if (photo == null && employee.getEmail() != null) {
            userRepository.findByEmail(employee.getEmail()).ifPresent(user -> {
                if (user.getProfilePhoto() != null) {
                    employee.setProfilePhoto(user.getProfilePhoto());
                    employee.setPhotoStatus(user.getPhotoStatus());
                }
            });
            photo = employee.getProfilePhoto();
            status = employee.getPhotoStatus();
        }

        return EmployeeDto.builder()
                .id(employee.getId())
                .employeeId(employee.getEmployeeId())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .name(employee.getName())
                .email(employee.getEmail())
                .phone(employee.getPhone())
                .department(employee.getDepartment())
                .role(employee.getRole())
                .status(employee.getStatus())
                .joiningDate(employee.getJoiningDate())
                .salary(employee.getSalary())
                .age(employee.getAge())
                .profilePhoto(photo)
                .photoStatus(status)
                .build();
    }
}
