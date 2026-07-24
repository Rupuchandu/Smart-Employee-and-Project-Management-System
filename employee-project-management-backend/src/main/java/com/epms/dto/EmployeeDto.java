package com.epms.dto;

import com.epms.entity.EmployeeStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDto {
    private Long id;

    private String employeeId;

    @NotBlank(message = "First name is required")
    @Pattern(regexp = "^[a-zA-Z\\s]{3,30}$", message = "First name must contain only alphabets and be between 3 and 30 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Pattern(regexp = "^[a-zA-Z\\s]{1,30}$", message = "Last name must contain only alphabets and be up to 30 characters")
    private String lastName;

    private String name; // Full name for response display

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be exactly 10 digits without spaces or special characters")
    private String phone;

    @NotBlank(message = "Department is required")
    private String department;

    @NotBlank(message = "Role/Designation is required")
    private String role;

    @NotNull(message = "Status is required")
    private EmployeeStatus status;

    private LocalDate joiningDate;

    @DecimalMin(value = "0.0", inclusive = true, message = "Salary must be a positive number")
    private BigDecimal salary;

    @Min(value = 18, message = "Age must be at least 18")
    @Max(value = 65, message = "Age cannot exceed 65")
    private Integer age;

    private String profilePhoto;

    private com.epms.entity.PhotoStatus photoStatus;
}
