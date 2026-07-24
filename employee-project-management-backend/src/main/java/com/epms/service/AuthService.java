package com.epms.service;

import com.epms.dto.JwtResponse;
import com.epms.dto.LoginRequest;
import com.epms.dto.SignupRequest;
import com.epms.entity.AccountStatus;
import com.epms.entity.Role;
import com.epms.entity.User;
import com.epms.exception.BadRequestException;
import com.epms.repository.EmployeeRepository;
import com.epms.repository.UserRepository;
import com.epms.security.JwtUtils;
import com.epms.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    public JwtResponse login(LoginRequest loginRequest) {
        String email = loginRequest.getEmail() != null ? loginRequest.getEmail().trim().toLowerCase() : "";
        String password = loginRequest.getPassword() != null ? loginRequest.getPassword() : "";

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            if (user.getAccountStatus() == AccountStatus.PENDING) {
                throw new BadRequestException("Your account registration is pending administrator approval. Please wait for approval before logging in.");
            } else if (user.getAccountStatus() == AccountStatus.REJECTED) {
                throw new BadRequestException("Your account registration request was rejected by administrator.");
            }
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String role = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_EMPLOYEE")
                .replace("ROLE_", "");

        String photo = user != null ? user.getProfilePhoto() : null;
        com.epms.entity.PhotoStatus photoStatus = user != null ? user.getPhotoStatus() : com.epms.entity.PhotoStatus.NONE;

        auditLogService.logAction(userDetails.getEmail(), role, "Login", "Authentication", "User logged in successfully");

        return JwtResponse.builder()
                .token(jwt)
                .type("Bearer")
                .id(userDetails.getId())
                .name(userDetails.getFullName())
                .email(userDetails.getEmail())
                .phone(userDetails.getPhone())
                .role(role)
                .profilePhoto(photo)
                .photoStatus(photoStatus)
                .build();
    }

    @Transactional
    public User signup(SignupRequest signupRequest) {
        String firstName = signupRequest.getFirstName() != null ? signupRequest.getFirstName().trim() : "";
        String lastName = signupRequest.getLastName() != null ? signupRequest.getLastName().trim() : "";
        String email = signupRequest.getEmail() != null ? signupRequest.getEmail().trim().toLowerCase() : "";
        String phone = signupRequest.getPhone() != null ? signupRequest.getPhone().trim() : "";

        // 1. Mobile Number Format Validation (10 digits)
        if (!StringUtils.hasText(phone) || !phone.matches("^[0-9]{10}$")) {
            throw new BadRequestException("INVALID_PHONE: Mobile number must be exactly 10 numeric digits!");
        }

        // 2. Mobile Number Duplicate Check against existing employees & users
        if (userRepository.existsByPhone(phone) || employeeRepository.existsByPhone(phone)) {
            throw new BadRequestException("DUPLICATE_PHONE: An employee account with this mobile number ('" + phone + "') is already registered!");
        }

        // 3. Email Address Duplicate Check
        if (userRepository.existsByEmail(email) || employeeRepository.existsByEmail(email)) {
            throw new BadRequestException("DUPLICATE_EMAIL: An employee with this email address ('" + email + "') is already registered!");
        }

        // 4. Employee Full Name Duplicate Check
        if (userRepository.existsByFirstNameIgnoreCaseAndLastNameIgnoreCase(firstName, lastName) ||
            employeeRepository.existsByFirstNameIgnoreCaseAndLastNameIgnoreCase(firstName, lastName)) {
            throw new BadRequestException("DUPLICATE_NAME: An employee with name '" + firstName + " " + lastName + "' is already registered in the system!");
        }

        User user = User.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .phone(phone)
                .password(passwordEncoder.encode(signupRequest.getPassword()))
                .role(Role.EMPLOYEE)
                .accountStatus(AccountStatus.PENDING)
                .age(signupRequest.getAge())
                .salary(signupRequest.getSalary())
                .build();

        User saved = userRepository.save(user);

        // Send Email Notification: Registration Submitted & Waiting for Admin Approval
        emailService.sendRegistrationSubmittedEmail(saved);

        return saved;
    }
}
