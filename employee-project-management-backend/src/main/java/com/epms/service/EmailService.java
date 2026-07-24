package com.epms.service;

import com.epms.entity.Employee;
import com.epms.entity.Project;
import com.epms.entity.Task;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:notifications.epms@gmail.com}")
    private String fromEmail;

    @Async
    public void sendRegistrationSubmittedEmail(com.epms.entity.User user) {
        if (user == null || user.getEmail() == null) return;

        String subject = "Account Registration Submitted - Pending Admin Approval";
        String content = "<h3>Registration Submitted, " + user.getFirstName() + " " + user.getLastName() + "!</h3>" +
                "<p>Your registration is submitted and is waiting for admin approval.</p>" +
                "<ul>" +
                "<li><strong>Registered Name:</strong> " + user.getFirstName() + " " + user.getLastName() + "</li>" +
                "<li><strong>Registered Email:</strong> " + user.getEmail() + "</li>" +
                "<li><strong>Mobile Number:</strong> " + user.getPhone() + "</li>" +
                "<li><strong>Status:</strong> PENDING ADMIN APPROVAL</li>" +
                "</ul>" +
                "<p>Once the administrator reviews and approves your account, you will be able to log in to the Smart EPMS portal.</p>";

        sendHtmlEmail(user.getEmail(), subject, content);
    }

    @Async
    public void sendWelcomeEmail(Employee employee) {
        String subject = "Welcome to Smart Employee & Project Management System";
        String content = "<h3>Welcome to Smart EPMS, " + employee.getName() + "!</h3>" +
                "<p>Your employee account has been created successfully.</p>" +
                "<ul>" +
                "<li><strong>Name:</strong> " + employee.getName() + "</li>" +
                "<li><strong>Login Email:</strong> " + employee.getEmail() + "</li>" +
                "<li><strong>Department:</strong> " + employee.getDepartment() + "</li>" +
                "<li><strong>Role / Designation:</strong> " + employee.getRole() + "</li>" +
                "</ul>" +
                "<p>You can now log in at <a href='http://localhost:5173/login'>Smart EPMS Portal</a> using your registered credentials.</p>";

        sendHtmlEmail(employee.getEmail(), subject, content);
    }

    @Async
    public void sendProjectAssignmentEmail(Project project, Collection<Employee> teamMembers) {
        String subject = "New Project Assigned";
        String teamRoster = teamMembers.stream().map(Employee::getName).collect(Collectors.joining(", "));

        String content = "<h3>New Project Assigned: " + project.getProjectName() + "</h3>" +
                "<p>You have been assigned to a new project team.</p>" +
                "<ul>" +
                "<li><strong>Project Name:</strong> " + project.getProjectName() + "</li>" +
                "<li><strong>Client:</strong> " + project.getClient() + "</li>" +
                "<li><strong>Description:</strong> " + (project.getDescription() != null ? project.getDescription() : "N/A") + "</li>" +
                "<li><strong>Team Members:</strong> " + teamRoster + "</li>" +
                "<li><strong>Start Date:</strong> " + (project.getStartDate() != null ? project.getStartDate() : "TBD") + "</li>" +
                "<li><strong>End Date / Deadline:</strong> " + (project.getEndDate() != null ? project.getEndDate() : "TBD") + "</li>" +
                "<li><strong>Priority:</strong> " + project.getPriority() + "</li>" +
                "<li><strong>Status:</strong> " + project.getStatus() + "</li>" +
                "</ul>";

        for (Employee emp : teamMembers) {
            if (emp.getEmail() != null) {
                sendHtmlEmail(emp.getEmail(), subject, content);
            }
        }
    }

    @Async
    public void sendProjectDeadlineUpdateEmail(Project project, Collection<Employee> teamMembers) {
        String subject = "Project Deadline Updated";
        String content = "<h3>Deadline Updated: " + project.getProjectName() + "</h3>" +
                "<p>The deadline for project <strong>" + project.getProjectName() + "</strong> has been updated.</p>" +
                "<ul>" +
                "<li><strong>New End Date:</strong> " + (project.getEndDate() != null ? project.getEndDate() : "TBD") + "</li>" +
                "<li><strong>Current Status:</strong> " + project.getStatus() + "</li>" +
                "</ul>";

        for (Employee emp : teamMembers) {
            if (emp.getEmail() != null) {
                sendHtmlEmail(emp.getEmail(), subject, content);
            }
        }
    }

    @Async
    public void sendTaskAssignmentEmail(Task task, Employee employee) {
        if (employee == null || employee.getEmail() == null) return;

        String subject = "New Task Assigned";
        String content = "<h3>New Task Assigned: " + task.getTaskTitle() + "</h3>" +
                "<p>Hello " + employee.getName() + ", a new task has been assigned to you.</p>" +
                "<ul>" +
                "<li><strong>Task Title:</strong> " + task.getTaskTitle() + "</li>" +
                "<li><strong>Project:</strong> " + (task.getProject() != null ? task.getProject().getProjectName() : "N/A") + "</li>" +
                "<li><strong>Priority:</strong> " + task.getPriority() + "</li>" +
                "<li><strong>Due Date:</strong> " + (task.getDueDate() != null ? task.getDueDate() : "N/A") + "</li>" +
                "<li><strong>Description:</strong> " + (task.getDescription() != null ? task.getDescription() : "N/A") + "</li>" +
                "</ul>";

        sendHtmlEmail(employee.getEmail(), subject, content);
    }

    @Async
    public void sendRegistrationStatusEmail(com.epms.entity.User user, boolean approved) {
        if (user == null || user.getEmail() == null) return;

        String statusText = approved ? "APPROVED" : "REJECTED";
        String subject = "Account Registration " + statusText + " - Smart EPMS";
        String content = "<h3>Account Registration Status Update</h3>" +
                "<p>Hello " + user.getFirstName() + " " + user.getLastName() + ",</p>" +
                "<p>Your account registration request has been <strong>" + statusText.toLowerCase() + "</strong> by the system administrator.</p>" +
                "<ul>" +
                "<li><strong>Status:</strong> " + statusText + "</li>" +
                "<li><strong>Registered Email:</strong> " + user.getEmail() + "</li>" +
                "</ul>" +
                (approved ? "<p>You can now log in at <a href='http://localhost:5173/login'>Smart EPMS Portal</a> using your registered credentials.</p>"
                          : "<p>If you believe this was an error, please contact your system administrator.</p>");

        sendHtmlEmail(user.getEmail(), subject, content);
    }

    @Async
    public void sendProjectCompletedEmail(Project project, Collection<Employee> teamMembers) {
        if (project == null || teamMembers == null || teamMembers.isEmpty()) return;

        String subject = "Project Completed: " + project.getProjectName();
        String content = "<h3>Project Completed!</h3>" +
                "<p>Project <strong>" + project.getProjectName() + "</strong> is completed.</p>" +
                "<ul>" +
                "<li><strong>Project Name:</strong> " + project.getProjectName() + "</li>" +
                "<li><strong>Client:</strong> " + (project.getClient() != null ? project.getClient() : "N/A") + "</li>" +
                "<li><strong>Status:</strong> COMPLETED</li>" +
                "</ul>" +
                "<p>Congratulations on completing the project deliverables!</p>";

        for (Employee emp : teamMembers) {
            if (emp.getEmail() != null) {
                sendHtmlEmail(emp.getEmail(), subject, content);
            }
        }
    }

    @Async
    public void sendProjectDeadlineUpcomingEmail(Project project, Collection<Employee> teamMembers) {
        if (project == null || teamMembers == null || teamMembers.isEmpty()) return;

        String subject = "Upcoming Project Deadline: " + project.getProjectName();
        String content = "<h3>Upcoming Project Deadline Notice</h3>" +
                "<p>The deadline for project <strong>" + project.getProjectName() + "</strong> is coming up soon.</p>" +
                "<ul>" +
                "<li><strong>Project Name:</strong> " + project.getProjectName() + "</li>" +
                "<li><strong>Target End Date / Deadline:</strong> " + (project.getEndDate() != null ? project.getEndDate() : "TBD") + "</li>" +
                "<li><strong>Current Status:</strong> " + project.getStatus() + "</li>" +
                "</ul>" +
                "<p>Please review and complete remaining tasks before the scheduled deadline.</p>";

        for (Employee emp : teamMembers) {
            if (emp.getEmail() != null) {
                sendHtmlEmail(emp.getEmail(), subject, content);
            }
        }
    }

    @Async
    public void sendTaskStatusUpdateEmail(Task task, Employee employee) {
        if (employee == null || employee.getEmail() == null) return;

        String subject = "Task Status Updated";
        String content = "<h3>Task Status Updated: " + task.getTaskTitle() + "</h3>" +
                "<p>Task update notification details:</p>" +
                "<ul>" +
                "<li><strong>Task Title:</strong> " + task.getTaskTitle() + "</li>" +
                "<li><strong>New Status:</strong> " + task.getStatus() + "</li>" +
                "<li><strong>Progress:</strong> " + task.getProgressPercentage() + "%</li>" +
                "<li><strong>Remarks:</strong> " + (task.getRemarks() != null ? task.getRemarks() : "None") + "</li>" +
                "</ul>";

        sendHtmlEmail(employee.getEmail(), subject, content);
    }

    private void sendHtmlEmail(String toEmail, String subject, String bodyHtml) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(bodyHtml, true);

            mailSender.send(message);
            logger.info("Notification email sent successfully to: {} with subject: {}", toEmail, subject);
        } catch (Exception e) {
            logger.warn("Could not send email to {} (SMTP host unconfigured or offline): {}", toEmail, e.getMessage());
        }
    }
}
