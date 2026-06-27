import React from 'react';

const Dashboard = () => {
  const kpiData = [
    { label: 'Total Users', value: '1,204' },
    { label: 'Revenue', value: '$48,320' },
    { label: 'Active Today', value: '87' },
    { label: 'Churn Rate', value: '2.3%' }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        padding: '40px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <h1
        style={{
          color: '#0ea5e9',
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '40px',
          textAlign: 'center'
        }}
      >
        Dashboard
      </h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {kpiData.map((kpi, index) => (
          <div
            key={index}
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              padding: '32px',
              border: '1px solid #0ea5e9',
              boxShadow: '0 4px 20px rgba(14, 165, 233, 0.15)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(14, 165, 233, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(14, 165, 233, 0.15)';
            }}
          >
            <p
              style={{
                color: '#94a3b8',
                fontSize: '14px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px'
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                color: '#0ea5e9',
                fontSize: '48px',
                fontWeight: '700',
                lineHeight: '1',
                margin: '0'
              }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;