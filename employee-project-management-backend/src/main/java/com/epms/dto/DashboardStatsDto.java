package com.epms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalEmployees;
    private long totalProjects;
    private long totalTasks;
    private long activeProjects;
    private long completedProjects;

    private long pendingTasks;
    private long completedTasks;
    private long inProgressTasks;
    private long todoTasks;

    // Scoped Employee Stats
    private long myAssignedTasksCount;
    private long myCompletedTasksCount;
    private long myPendingTasksCount;

    private List<TaskDto> upcomingDeadlines;
    private List<TaskDto> recentTasks;
}
