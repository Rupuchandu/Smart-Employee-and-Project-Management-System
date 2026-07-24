package com.epms.controller;

import com.epms.dto.ApiResponse;
import com.epms.dto.ProjectDto;
import com.epms.dto.TaskDto;
import com.epms.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.epms.service.AuditLogService;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final AuditLogService auditLogService;

    @GetMapping("/employee-tasks")
    public ResponseEntity<ApiResponse<List<ReportService.EmployeeTaskReport>>> getEmployeeTaskReport() {
        return ResponseEntity.ok(ApiResponse.success("Employee task report generated", reportService.getEmployeeTaskReport()));
    }

    @GetMapping("/project-progress")
    public ResponseEntity<ApiResponse<List<ProjectDto>>> getProjectProgressReport() {
        return ResponseEntity.ok(ApiResponse.success("Project progress report generated", reportService.getProjectProgressReport()));
    }

    @GetMapping("/pending-tasks")
    public ResponseEntity<ApiResponse<List<TaskDto>>> getPendingTaskReport() {
        return ResponseEntity.ok(ApiResponse.success("Pending tasks report generated", reportService.getPendingTaskReport()));
    }

    @GetMapping("/completed-tasks")
    public ResponseEntity<ApiResponse<List<TaskDto>>> getCompletedTaskReport() {
        return ResponseEntity.ok(ApiResponse.success("Completed tasks report generated", reportService.getCompletedTaskReport()));
    }

    @PostMapping("/log-export")
    public ResponseEntity<ApiResponse<Void>> logReportExport(@RequestBody Map<String, String> payload) {
        String format = payload.getOrDefault("format", "PDF");
        String reportName = payload.getOrDefault("reportName", "Management Report");
        String action = "Export " + (format.equalsIgnoreCase("excel") ? "Excel" : "PDF");
        auditLogService.logAction(null, null, action, "Reports", "Exported " + reportName + " in " + format.toUpperCase() + " format");
        return ResponseEntity.ok(ApiResponse.success("Report export logged successfully"));
    }
}
