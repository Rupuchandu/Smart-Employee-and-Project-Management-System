import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const Toast = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const getToastClass = () => {
    switch (type) {
      case 'success':
        return 'alert-success border-success text-success bg-opacity-10';
      case 'error':
      case 'danger':
        return 'alert-danger border-danger text-danger bg-opacity-10';
      case 'warning':
        return 'alert-warning border-warning text-warning bg-opacity-10';
      default:
        return 'alert-info border-info text-info bg-opacity-10';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="me-2" size={20} />;
      case 'error':
      case 'danger':
        return <AlertCircle className="me-2" size={20} />;
      default:
        return <Info className="me-2" size={20} />;
    }
  };

  return (
    <div className={`alert ${getToastClass()} alert-dismissible fade show d-flex align-items-center mb-4`} role="alert">
      {getIcon()}
      <div className="flex-grow-1 font-medium">{message}</div>
      {onClose && (
        <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
      )}
    </div>
  );
};

export default Toast;
