package com.epms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String projectName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String client;

    private String department;

    @Enumerated(EnumType.STRING)
    private ProjectPriority priority;

    private LocalDate startDate;

    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectStatus status;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "project_employees",
        joinColumns = @JoinColumn(name = "project_id"),
        inverseJoinColumns = @JoinColumn(name = "employee_id")
    )
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @Builder.Default
    private Set<Employee> assignedEmployees = new HashSet<>();

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = ProjectStatus.NOT_STARTED;
        }
        if (this.priority == null) {
            this.priority = ProjectPriority.MEDIUM;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Helper for backward compatibility
    public Employee getAssignedEmployee() {
        if (assignedEmployees != null && !assignedEmployees.isEmpty()) {
            return assignedEmployees.iterator().next();
        }
        return null;
    }

    public void setAssignedEmployee(Employee employee) {
        if (this.assignedEmployees == null) {
            this.assignedEmployees = new HashSet<>();
        }
        if (employee != null) {
            this.assignedEmployees.add(employee);
        }
    }
}
