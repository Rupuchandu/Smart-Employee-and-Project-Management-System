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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private LoginRequest loginRequest;
    private SignupRequest signupRequest;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@company.com")
                .password("encoded_pass")
                .phone("9876543210")
                .role(Role.EMPLOYEE)
                .accountStatus(AccountStatus.APPROVED)
                .build();

        loginRequest = new LoginRequest();
        loginRequest.setEmail("john.doe@company.com");
        loginRequest.setPassword("Password@123");

        signupRequest = new SignupRequest();
        signupRequest.setFirstName("Jane");
        signupRequest.setLastName("Smith");
        signupRequest.setEmail("jane.smith@company.com");
        signupRequest.setPhone("9876543211");
        signupRequest.setPassword("Password@123");
        signupRequest.setAge(25);
        signupRequest.setSalary(new BigDecimal("60000"));
    }

    @Test
    void testSuccessfulLogin() {
        // Arrange
        when(userRepository.findByEmail("john.doe@company.com")).thenReturn(Optional.of(sampleUser));

        UserDetailsImpl userDetails = UserDetailsImpl.build(sampleUser);

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(jwtUtils.generateJwtToken(authentication)).thenReturn("mock_jwt_token");

        // Act
        JwtResponse response = authService.login(loginRequest);

        // Assert
        assertNotNull(response);
        assertEquals("mock_jwt_token", response.getToken());
        assertEquals("john.doe@company.com", response.getEmail());
        assertEquals("John Doe", response.getName());
        assertEquals("EMPLOYEE", response.getRole());

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtUtils, times(1)).generateJwtToken(authentication);
    }

    @Test
    void testLoginInvalidCredentials() {
        // Arrange
        when(userRepository.findByEmail("john.doe@company.com")).thenReturn(Optional.of(sampleUser));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        // Act & Assert
        assertThrows(BadCredentialsException.class, () -> authService.login(loginRequest));
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void testLoginUserPendingApproval() {
        // Arrange
        sampleUser.setAccountStatus(AccountStatus.PENDING);
        when(userRepository.findByEmail("john.doe@company.com")).thenReturn(Optional.of(sampleUser));

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.login(loginRequest));
        assertTrue(exception.getMessage().contains("pending administrator approval"));
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void testLoginUserRejected() {
        // Arrange
        sampleUser.setAccountStatus(AccountStatus.REJECTED);
        when(userRepository.findByEmail("john.doe@company.com")).thenReturn(Optional.of(sampleUser));

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.login(loginRequest));
        assertTrue(exception.getMessage().contains("request was rejected"));
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void testSignupSuccessful() {
        // Arrange
        when(userRepository.existsByPhone("9876543211")).thenReturn(false);
        when(employeeRepository.existsByPhone("9876543211")).thenReturn(false);
        when(userRepository.existsByEmail("jane.smith@company.com")).thenReturn(false);
        when(employeeRepository.existsByEmail("jane.smith@company.com")).thenReturn(false);
        when(userRepository.existsByFirstNameIgnoreCaseAndLastNameIgnoreCase("Jane", "Smith")).thenReturn(false);
        when(employeeRepository.existsByFirstNameIgnoreCaseAndLastNameIgnoreCase("Jane", "Smith")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("encoded_pass");

        User savedUser = User.builder()
                .id(2L)
                .firstName("Jane")
                .lastName("Smith")
                .email("jane.smith@company.com")
                .phone("9876543211")
                .password("encoded_pass")
                .role(Role.EMPLOYEE)
                .accountStatus(AccountStatus.PENDING)
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // Act
        User result = authService.signup(signupRequest);

        // Assert
        assertNotNull(result);
        assertEquals(2L, result.getId());
        assertEquals("Jane", result.getFirstName());
        assertEquals("jane.smith@company.com", result.getEmail());
        assertEquals(AccountStatus.PENDING, result.getAccountStatus());

        verify(passwordEncoder, times(1)).encode("Password@123");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testSignupDuplicateEmail() {
        // Arrange
        when(userRepository.existsByPhone("9876543211")).thenReturn(false);
        when(employeeRepository.existsByPhone("9876543211")).thenReturn(false);
        when(userRepository.existsByEmail("jane.smith@company.com")).thenReturn(true);

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.signup(signupRequest));
        assertTrue(exception.getMessage().contains("DUPLICATE_EMAIL"));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testSignupDuplicatePhone() {
        // Arrange
        when(userRepository.existsByPhone("9876543211")).thenReturn(true);

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.signup(signupRequest));
        assertTrue(exception.getMessage().contains("DUPLICATE_PHONE"));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testSignupInvalidPhone() {
        // Arrange
        signupRequest.setPhone("123");

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.signup(signupRequest));
        assertTrue(exception.getMessage().contains("INVALID_PHONE"));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testSignupDuplicateName() {
        // Arrange
        when(userRepository.existsByPhone("9876543211")).thenReturn(false);
        when(employeeRepository.existsByPhone("9876543211")).thenReturn(false);
        when(userRepository.existsByEmail("jane.smith@company.com")).thenReturn(false);
        when(employeeRepository.existsByEmail("jane.smith@company.com")).thenReturn(false);
        when(userRepository.existsByFirstNameIgnoreCaseAndLastNameIgnoreCase("Jane", "Smith")).thenReturn(true);

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.signup(signupRequest));
        assertTrue(exception.getMessage().contains("DUPLICATE_NAME"));
        verify(userRepository, never()).save(any());
    }
}
