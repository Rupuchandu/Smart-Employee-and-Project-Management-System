package com.epms.controller;

import com.epms.dto.ApiResponse;
import com.epms.dto.DashboardStatsDto;
import com.epms.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getDashboardStats(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        DashboardStatsDto stats = dashboardService.getDashboardStats(email);
        return ResponseEntity.ok(ApiResponse.success("Dashboard metrics retrieved", stats));
    }
}
