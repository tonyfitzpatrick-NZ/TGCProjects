import { useNavigate } from 'react-router-dom';

export default function AdminSchedulePage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{ padding: '10px 20px', marginBottom: '30px', fontSize: '15px' }}
      >
        ← Back to Settings
      </button>

      <h1 style={{ fontSize: '28px', marginBottom: '16px' }}>Schedule of Finishes — Master Admin</h1>
      
      <div style={{ 
        background: '#fff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '12px', 
        padding: '60px 40px',
        maxWidth: '700px',
        margin: '0 auto'
      }}>
        <h2>Admin Panel Under Construction</h2>
        <p style={{ marginTop: '20px', fontSize: '17px', color: '#555' }}>
          Full CRUD management (add/edit/delete sections, items, options, templates) is being built.
        </p>
        <p style={{ marginTop: '30px', color: '#666' }}>
          You can currently manage project-specific selections from the <strong>Project → Schedule</strong> tab.
        </p>
      </div>
    </div>
  );
}
