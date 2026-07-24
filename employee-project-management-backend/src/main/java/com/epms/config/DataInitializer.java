package com.epms.config;

import com.epms.entity.*;
import com.epms.repository.*;
import com.epms.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeService employeeService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initDepartments();
        initDefaultAdmin();
        initSampleData();
        removeTargetEmployees();
    }

    private void initDepartments() {
        if (departmentRepository.count() == 0) {
            departmentRepository.save(Department.builder().name("Engineering").code("ENG").description("Software engineering and technical development").build());
            departmentRepository.save(Department.builder().name("Product").code("PRD").description("Product design, roadmap, and strategy").build());
            departmentRepository.save(Department.builder().name("Design").code("DSG").description("UI/UX design and user experience research").build());
            departmentRepository.save(Department.builder().name("Marketing").code("MKT").description("Brand growth and digital marketing").build());
            departmentRepository.save(Department.builder().name("Human Resources").code("HR").description("Talent acquisition and employee engagement").build());
            logger.info("Departments seeded.");
        }
    }

    private void initDefaultAdmin() {
        String adminEmail = "admin@gmail.com";
        User admin = userRepository.findByEmail(adminEmail).orElse(null);
        if (admin == null) {
            admin = User.builder()
                    .firstName("Administrator")
                    .lastName("User")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("Admin@123"))
                    .phone("9876543210")
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            logger.info("Default Admin account created successfully with email: {}", adminEmail);
        } else {
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
            logger.info("Default Admin account password verified and updated for email: {}", adminEmail);
        }
    }

    private void initSampleData() {
        if (employeeRepository.count() == 0) {
            Employee emp1 = employeeRepository.save(Employee.builder()
                    .employeeId("EMP1001")
                    .firstName("Alex")
                    .lastName("Morgan")
                    .email("alex.morgan@company.com")
                    .phone("9876543211")
                    .department("Engineering")
                    .role("Senior Full Stack Engineer")
                    .status(EmployeeStatus.ACTIVE)
                    .joiningDate(LocalDate.of(2023, 1, 15))
                    .salary(new BigDecimal("85000"))
                    .age(29)
                    .build());

            logger.info("Sample employee created.");

            if (projectRepository.count() == 0) {
                Project proj1 = projectRepository.save(Project.builder()
                        .projectName("Smart Employee & Project System")
                        .description("Comprehensive enterprise portal for employee lifecycle, project allocations, and task tracking.")
                        .client("TechCorp Global")
                        .department("Engineering")
                        .priority(ProjectPriority.HIGH)
                        .startDate(LocalDate.of(2024, 1, 10))
                        .endDate(LocalDate.of(2024, 6, 30))
                        .status(ProjectStatus.IN_PROGRESS)
                        .build());
                proj1.setAssignedEmployee(emp1);
                projectRepository.save(proj1);

                logger.info("Sample project created.");

                if (taskRepository.count() == 0) {
                    taskRepository.save(Task.builder()
                            .taskTitle("Design Spring Boot Security & JWT Architecture")
                            .description("Implement stateless JWT token filter, password encoder, and auth controllers.")
                            .assignedEmployee(emp1)
                            .project(proj1)
                            .priority(TaskPriority.HIGH)
                            .status(TaskStatus.COMPLETED)
                            .progressPercentage(100)
                            .dueDate(LocalDate.now().plusDays(5))
                            .remarks("JWT authentication fully tested and verified.")
                            .build());

                    logger.info("Sample tasks created.");
                }
            }
        }
    }

    private void removeTargetEmployees() {
        try {
            List<Employee> employees = employeeRepository.findAll();
            for (Employee emp : employees) {
                String name = emp.getName() != null ? emp.getName().toLowerCase() : "";
                if (name.contains("sophia") && name.contains("chen")) {
                    employeeService.deleteEmployee(emp.getId());
                    logger.info("Removed default employee: Sophia Chen");
                } else if (name.contains("david") && name.contains("miller")) {
                    employeeService.deleteEmployee(emp.getId());
                    logger.info("Removed default employee: David Miller");
                }
            }
        } catch (Exception e) {
            logger.warn("Could not remove target default employees: {}", e.getMessage());
        }
    }
}
