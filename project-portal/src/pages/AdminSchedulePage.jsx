 import { useNavigate } from 'react-router-dom';

export default function AdminSchedulePage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{ marginBottom: '20px', padding: '8px 16px' }}
      >
        ← Back to Settings
      </button>

      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Schedule of Finishes — Master Admin</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Full management (add/edit/delete sections, items, options, templates, AI research) is being built.
      </p>

      <div style={{ 
        padding: '60px', 
        textAlign: 'center', 
        background: '#f8fafc', 
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <h2>Admin Panel Under Construction</h2>
        <p style={{ marginTop: '16px', color: '#555' }}>
          You can currently manage the schedule from the Project → Schedule tab.<br />
          Full CRUD admin tools coming in the next update.
        </p>
      </div>
    </div>
  );
}
