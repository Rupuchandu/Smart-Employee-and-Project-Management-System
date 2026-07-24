package com.epms.service;

import com.epms.dto.ChangePasswordRequest;
import com.epms.dto.ProfileUpdateRequest;
import com.epms.entity.User;
import com.epms.exception.BadRequestException;
import com.epms.exception.ResourceNotFoundException;
import com.epms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.entity.AccountStatus;
import com.epms.entity.Employee;
import com.epms.entity.EmployeeStatus;
import com.epms.repository.EmployeeRepository;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    public User getUserProfile(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public List<User> getPendingRegistrations() {
        return userRepository.findByAccountStatus(AccountStatus.PENDING);
    }

    @Transactional
    public User approveRegistration(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setAccountStatus(AccountStatus.APPROVED);
        User savedUser = userRepository.save(user);

        // Sync or create Employee record so they appear in employee management
        if (!employeeRepository.existsByEmail(user.getEmail())) {
            Employee employee = Employee.builder()
                    .employeeId("EMP" + (1000 + user.getId()))
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .department("Engineering")
                    .role("Employee")
                    .status(EmployeeStatus.ACTIVE)
                    .joiningDate(java.time.LocalDate.now())
                    .salary(user.getSalary())
                    .age(user.getAge())
                    .build();
            employeeRepository.save(employee);
        }

        auditLogService.logAction(null, null, "Approve Employee", "Registration", "Approved employee registration for: " + user.getEmail());

        // Send Approval Email to Employee
        emailService.sendRegistrationStatusEmail(savedUser, true);

        return savedUser;
    }

    @Transactional
    public User rejectRegistration(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setAccountStatus(AccountStatus.REJECTED);
        User saved = userRepository.save(user);

        auditLogService.logAction(null, null, "Reject Employee", "Registration", "Rejected employee registration for: " + user.getEmail());

        // Send Rejection Email to Employee
        emailService.sendRegistrationStatusEmail(saved, false);

        return saved;
    }

    @Transactional
    public User updateProfile(String email, ProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setPhone(request.getPhone().trim());

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Incorrect current password!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public User uploadProfilePhoto(String email, com.epms.dto.ProfilePhotoRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        user.setPendingProfilePhoto(request.getPhoto());
        user.setPhotoStatus(com.epms.entity.PhotoStatus.PENDING);
        User saved = userRepository.save(user);

        // Also sync pending photo to Employee table if exists
        employeeRepository.findByEmail(email).ifPresent(emp -> {
            emp.setPendingProfilePhoto(request.getPhoto());
            emp.setPhotoStatus(com.epms.entity.PhotoStatus.PENDING);
            employeeRepository.save(emp);
        });

        return saved;
    }

    public List<User> getPendingProfilePhotoRequests() {
        return userRepository.findByPhotoStatus(com.epms.entity.PhotoStatus.PENDING);
    }

    @Transactional
    public User approveProfilePhoto(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setProfilePhoto(user.getPendingProfilePhoto());
        user.setPendingProfilePhoto(null);
        user.setPhotoStatus(com.epms.entity.PhotoStatus.APPROVED);
        User saved = userRepository.save(user);

        // Sync approved photo to Employee entity if exists
        employeeRepository.findByEmail(user.getEmail()).ifPresent(emp -> {
            emp.setProfilePhoto(saved.getProfilePhoto());
            emp.setPendingProfilePhoto(null);
            emp.setPhotoStatus(com.epms.entity.PhotoStatus.APPROVED);
            employeeRepository.save(emp);
        });

        return saved;
    }

    @Transactional
    public User rejectProfilePhoto(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setPendingProfilePhoto(null);
        user.setPhotoStatus(com.epms.entity.PhotoStatus.REJECTED);
        User saved = userRepository.save(user);

        // Sync rejected status to Employee entity if exists
        employeeRepository.findByEmail(user.getEmail()).ifPresent(emp -> {
            emp.setPendingProfilePhoto(null);
            emp.setPhotoStatus(com.epms.entity.PhotoStatus.REJECTED);
            employeeRepository.save(emp);
        });

        return saved;
    }
}
