import React from 'react';

const Loader = ({ fullPage = false, message = 'Loading...' }) => {
  if (fullPage) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-dark text-white">
        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted font-semibold">{message}</p>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center p-4">
      <div className="spinner-border text-primary me-2" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <span className="text-muted">{message}</span>
    </div>
  );
};

export default Loader;
