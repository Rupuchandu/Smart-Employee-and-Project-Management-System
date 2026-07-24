package com.epms.controller;

import com.epms.dto.ApiResponse;
import com.epms.dto.TaskDto;
import com.epms.dto.TaskProgressRequest;
import com.epms.entity.TaskPriority;
import com.epms.entity.TaskStatus;
import com.epms.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskDto>>> getAllTasks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long projectId) {
        List<TaskDto> tasks = taskService.getAllTasks(search, status, priority, employeeId, projectId);
        return ResponseEntity.ok(ApiResponse.success("Tasks retrieved successfully", tasks));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskDto>> getTaskById(@PathVariable Long id) {
        TaskDto task = taskService.getTaskById(id);
        return ResponseEntity.ok(ApiResponse.success("Task details retrieved", task));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaskDto>> createTask(@Valid @RequestBody TaskDto taskDto) {
        TaskDto created = taskService.createTask(taskDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskDto>> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskDto taskDto) {
        TaskDto updated = taskService.updateTask(id, taskDto);
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully", updated));
    }

    @RequestMapping(value = "/{id}/progress", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<ApiResponse<TaskDto>> updateTaskProgress(
            @PathVariable Long id,
            @Valid @RequestBody TaskProgressRequest request) {
        TaskDto updated = taskService.updateTaskProgress(id, request);
        return ResponseEntity.ok(ApiResponse.success("Task progress updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully"));
    }
}
