package com.epms.service;

import com.epms.entity.AuditLog;
import com.epms.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void logAction(String username, String role, String action, String module, String description) {
        try {
            if (!StringUtils.hasText(username) || !StringUtils.hasText(role)) {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                    if (!StringUtils.hasText(username)) {
                        username = auth.getName();
                    }
                    if (!StringUtils.hasText(role) && !auth.getAuthorities().isEmpty()) {
                        role = auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
                    }
                }
            }

            if (!StringUtils.hasText(username)) {
                username = "SYSTEM";
            }
            if (!StringUtils.hasText(role)) {
                role = "USER";
            }

            AuditLog log = AuditLog.builder()
                    .username(username)
                    .userRole(role)
                    .action(action)
                    .module(module)
                    .description(description)
                    .build();

            auditLogRepository.save(log);
        } catch (Exception e) {
            // Silently ignore audit log failures so business operations complete cleanly
        }
    }

    public List<AuditLog> getAuditLogs(String search, String module, String startDateStr, String endDateStr) {
        LocalDateTime start = StringUtils.hasText(startDateStr) ? LocalDate.parse(startDateStr).atStartOfDay() : null;
        LocalDateTime end = StringUtils.hasText(endDateStr) ? LocalDate.parse(endDateStr).atTime(LocalTime.MAX) : null;
        return auditLogRepository.filterAuditLogs(
                StringUtils.hasText(search) ? search.trim() : null,
                StringUtils.hasText(module) ? module.trim() : null,
                start,
                end
        );
    }
}
