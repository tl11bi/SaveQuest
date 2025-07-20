import React from 'react';

interface StatusMessageProps {
  type: 'success' | 'error';
  message: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ type, message }) => (
  <div
    style={{
      color: type === 'success' ? 'green' : '#d32f2f',
      marginBottom: 12,
      padding: '8px 12px',
      backgroundColor: type === 'success' ? '#e8f5e8' : '#ffeaea',
      borderRadius: 6,
      border: `1px solid ${type === 'success' ? '#4caf50' : '#f44336'}`,
    }}
  >
    {message}
  </div>
);

export default StatusMessage;
