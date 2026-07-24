package com.epms.controller;

import com.epms.dto.ApiResponse;
import com.epms.entity.AuditLog;
import com.epms.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        List<AuditLog> logs = auditLogService.getAuditLogs(search, module, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved successfully", logs));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logLogout(
            @RequestBody(required = false) Map<String, String> payload,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : (payload != null ? payload.get("email") : "USER");
        String role = authentication != null && !authentication.getAuthorities().isEmpty() ?
                authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "") : "USER";
        auditLogService.logAction(username, role, "Logout", "Authentication", "User logged out successfully");
        return ResponseEntity.ok(ApiResponse.success("Logout logged successfully"));
    }
}
