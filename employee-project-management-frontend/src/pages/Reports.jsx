import React, { useState, useEffect } from 'react';
import { Download, Users, Briefcase, Clock, CheckCircle2, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

const Reports = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState(isAdmin ? 'employee-tasks' : 'project-progress');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', message: '' });

  const [employeeReport, setEmployeeReport] = useState([]);
  const [projectReport, setProjectReport] = useState([]);
  const [pendingReport, setPendingReport] = useState([]);
  const [completedReport, setCompletedReport] = useState([]);

  useEffect(() => {
    fetchReportData(activeTab);
  }, [activeTab]);

  const fetchReportData = async (tab) => {
    setLoading(true);
    try {
      const response = await api.get(`/reports/${tab}`);
      if (response.data.success) {
        if (tab === 'employee-tasks') setEmployeeReport(response.data.data);
        else if (tab === 'project-progress') setProjectReport(response.data.data);
        else if (tab === 'pending-tasks') setPendingReport(response.data.data);
        else if (tab === 'completed-tasks') setCompletedReport(response.data.data);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to generate report' });
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    let data = [];
    let filename = '';

    if (activeTab === 'employee-tasks') {
      data = employeeReport.map((e) => ({
        'Employee ID': e.employeeId,
        'Employee Name': e.employeeName,
        Department: e.department,
        'Total Tasks': e.totalTasks,
        'Completed Tasks': e.completedTasks,
        'Pending Tasks': e.pendingTasks,
        'Completion Rate (%)': `${e.completionRate}%`,
      }));
      filename = 'Employee_Task_Report.xlsx';
    } else if (activeTab === 'project-progress') {
      data = projectReport.map((p) => ({
        'Project ID': p.id,
        'Project Name': p.projectName,
        Client: p.client,
        Department: p.department || 'General',
        Priority: p.priority || 'MEDIUM',
        Status: p.status,
        'Start Date': p.startDate || 'N/A',
        'End Date': p.endDate || 'N/A',
      }));
      filename = 'Project_Progress_Report.xlsx';
    } else {
      const source = activeTab === 'pending-tasks' ? pendingReport : completedReport;
      data = source.map((t) => ({
        'Task ID': t.id,
        'Task Title': t.taskTitle,
        Project: t.projectName,
        'Assigned Employee': t.assignedEmployeeName,
        Priority: t.priority,
        Status: t.status,
        'Progress (%)': `${t.progressPercentage}%`,
        'Due Date': t.dueDate || 'N/A',
        Remarks: t.remarks || 'None',
      }));
      filename = activeTab === 'pending-tasks' ? 'Pending_Tasks_Report.xlsx' : 'Completed_Tasks_Report.xlsx';
    }

    if (data.length === 0) {
      alert('No data available to export.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, filename);

    try {
      api.post('/reports/log-export', { format: 'excel', reportName: filename.replace('.xlsx', '') });
    } catch (e) {}
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const todayStr = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229); // Primary Indigo color

    if (activeTab === 'employee-tasks') {
      doc.text('Smart EPMS - Employee Task Report', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${todayStr}`, 14, 28);

      const tableHeaders = [['Employee ID', 'Employee Name', 'Department', 'Total Tasks', 'Completed', 'Pending', 'Completion Rate']];
      const tableRows = employeeReport.map((e) => [
        e.employeeId,
        e.employeeName,
        e.department,
        e.totalTasks,
        e.completedTasks,
        e.pendingTasks,
        `${e.completionRate}%`,
      ]);

      doc.autoTable({
        head: tableHeaders,
        body: tableRows,
        startY: 34,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
      });
      doc.save('Employee_Task_Report.pdf');
    } else if (activeTab === 'project-progress') {
      doc.text('Smart EPMS - Project Progress Report', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${todayStr}`, 14, 28);

      const tableHeaders = [['Project Name', 'Client', 'Department', 'Priority', 'Status', 'Start Date', 'End Date']];
      const tableRows = projectReport.map((p) => [
        p.projectName,
        p.client,
        p.department || 'General',
        p.priority || 'MEDIUM',
        p.status,
        p.startDate || 'N/A',
        p.endDate || 'N/A',
      ]);

      doc.autoTable({
        head: tableHeaders,
        body: tableRows,
        startY: 34,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237] },
      });
      doc.save('Project_Progress_Report.pdf');
    } else {
      const isPending = activeTab === 'pending-tasks';
      const title = isPending ? 'Smart EPMS - Pending Tasks Report' : 'Smart EPMS - Completed Tasks Report';
      const source = isPending ? pendingReport : completedReport;

      doc.text(title, 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${todayStr}`, 14, 28);

      const tableHeaders = [['Task Title', 'Project', 'Assigned To', 'Priority', 'Progress', 'Due Date']];
      const tableRows = source.map((t) => [
        t.taskTitle,
        t.projectName,
        t.assignedEmployeeName,
        t.priority,
        `${t.progressPercentage}%`,
        t.dueDate || 'N/A',
      ]);

      doc.autoTable({
        head: tableHeaders,
        body: tableRows,
        startY: 34,
        theme: 'striped',
        headStyles: { fillColor: isPending ? [239, 68, 68] : [16, 185, 129] },
      });
      doc.save(isPending ? 'Pending_Tasks_Report.pdf' : 'Completed_Tasks_Report.pdf');
    }

    try {
      const pdfName = activeTab === 'employee-tasks' ? 'Employee_Task_Report' : activeTab === 'project-progress' ? 'Project_Progress_Report' : activeTab === 'pending-tasks' ? 'Pending_Tasks_Report' : 'Completed_Tasks_Report';
      api.post('/reports/log-export', { format: 'pdf', reportName: pdfName });
    } catch (e) {}
  };

  return (
    <div>
      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />}

      {/* Header Tabs & Export Buttons */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <ul className="nav nav-pills bg-secondary bg-opacity-10 p-1 rounded-3">
          {isAdmin && (
            <li className="nav-item">
              <button
                className={`nav-link rounded-3 d-flex align-items-center gap-2 ${activeTab === 'employee-tasks' ? 'active bg-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('employee-tasks')}
              >
                <Users size={16} /> Employee Task Report
              </button>
            </li>
          )}
          <li className="nav-item">
            <button
              className={`nav-link rounded-3 d-flex align-items-center gap-2 ${activeTab === 'project-progress' ? 'active bg-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('project-progress')}
            >
              <Briefcase size={16} /> Project Progress
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-3 d-flex align-items-center gap-2 ${activeTab === 'pending-tasks' ? 'active bg-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('pending-tasks')}
            >
              <Clock size={16} /> Pending Tasks
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-3 d-flex align-items-center gap-2 ${activeTab === 'completed-tasks' ? 'active bg-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('completed-tasks')}
            >
              <CheckCircle2 size={16} /> Completed Tasks
            </button>
          </li>
        </ul>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-danger d-flex align-items-center gap-2 rounded-3" onClick={exportPDF}>
            <FileText size={18} />
            <span>Export PDF</span>
          </button>
          <button className="btn btn-outline-success d-flex align-items-center gap-2 rounded-3" onClick={exportExcel}>
            <FileSpreadsheet size={18} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Report Table Content */}
      {loading ? (
        <Loader message="Generating report..." />
      ) : (
        <div className="custom-table-container">
          <div className="table-responsive">
            {activeTab === 'employee-tasks' && (
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Total Assigned Tasks</th>
                    <th>Completed Tasks</th>
                    <th>Pending Tasks</th>
                    <th>Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeReport.map((emp) => (
                    <tr key={emp.employeeId}>
                      <td className="fw-bold text-white">{emp.employeeName}</td>
                      <td>{emp.department}</td>
                      <td><span className="badge bg-secondary bg-opacity-25 text-light">{emp.totalTasks}</span></td>
                      <td><span className="badge bg-success bg-opacity-25 text-success">{emp.completedTasks}</span></td>
                      <td><span className="badge bg-warning bg-opacity-25 text-warning">{emp.pendingTasks}</span></td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1 bg-secondary bg-opacity-25" style={{ height: '8px', width: '100px' }}>
                            <div className="progress-bar bg-success" style={{ width: `${emp.completionRate}%` }}></div>
                          </div>
                          <span className="small text-muted font-bold">{emp.completionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'project-progress' && (
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Client</th>
                    <th>Department</th>
                    <th>Priority</th>
                    <th>Timeline</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projectReport.map((proj) => (
                    <tr key={proj.id}>
                      <td className="fw-bold text-white">{proj.projectName}</td>
                      <td>{proj.client}</td>
                      <td>{proj.department || 'General'}</td>
                      <td><span className="badge bg-info bg-opacity-25 text-info">{proj.priority || 'MEDIUM'}</span></td>
                      <td className="small text-muted">{proj.startDate || 'N/A'} &rarr; {proj.endDate || 'N/A'}</td>
                      <td><span className="badge bg-primary bg-opacity-25 text-primary">{proj.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {(activeTab === 'pending-tasks' || activeTab === 'completed-tasks') && (
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Task Title</th>
                    <th>Project</th>
                    <th>Assigned To</th>
                    <th>Priority</th>
                    <th>Progress</th>
                    <th>Due Date</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'pending-tasks' ? pendingReport : completedReport).map((t) => (
                    <tr key={t.id}>
                      <td className="fw-bold text-white">{t.taskTitle}</td>
                      <td>{t.projectName}</td>
                      <td>{t.assignedEmployeeName}</td>
                      <td><span className="badge bg-secondary bg-opacity-25 text-light">{t.priority}</span></td>
                      <td>{t.progressPercentage}%</td>
                      <td>{t.dueDate || 'N/A'}</td>
                      <td className="small text-muted text-truncate" style={{ maxWidth: '200px' }}>{t.remarks || 'None'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
