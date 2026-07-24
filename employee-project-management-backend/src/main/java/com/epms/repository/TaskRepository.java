package com.epms.repository;

import com.epms.entity.Task;
import com.epms.entity.TaskPriority;
import com.epms.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByAssignedEmployeeId(Long employeeId);
    List<Task> findByProjectId(Long projectId);
    List<Task> findByStatus(TaskStatus status);
    List<Task> findByStatusNot(TaskStatus status);

    long countByStatus(TaskStatus status);
    long countByAssignedEmployeeId(Long employeeId);
    long countByAssignedEmployeeIdAndStatus(Long employeeId, TaskStatus status);
    long countByAssignedEmployeeIdAndStatusNot(Long employeeId, TaskStatus status);

    List<Task> findByAssignedEmployeeIdAndDueDateGreaterThanEqualOrderByDueDateAsc(Long employeeId, LocalDate date);

    @Query("SELECT t FROM Task t WHERE " +
           "(:query IS NULL OR :query = '' OR LOWER(t.taskTitle) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:employeeId IS NULL OR t.assignedEmployee.id = :employeeId) AND " +
           "(:projectId IS NULL OR t.project.id = :projectId)")
    List<Task> filterTasks(
            @Param("query") String query,
            @Param("status") TaskStatus status,
            @Param("priority") TaskPriority priority,
            @Param("employeeId") Long employeeId,
            @Param("projectId") Long projectId
    );
}
