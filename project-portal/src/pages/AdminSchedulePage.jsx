import { useNavigate } from 'react-router-dom';

export default function AdminSchedulePage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{ padding: '10px 20px', marginBottom: '30px' }}
      >
        ← Back to Settings
      </button>

      <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>Schedule of Finishes — Master Admin</h1>
      
      <div style={{ 
        background: '#fff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '12px', 
        padding: '60px 40px'
      }}>
        <h2>Admin Panel</h2>
        <p style={{ marginTop: '20px', fontSize: '17px', color: '#555' }}>
          Full CRUD management for sections, items, options, templates, and product data is being built.
        </p>
        <p style={{ marginTop: '30px', color: '#666' }}>
          You can manage selections from the Project → Schedule tab for now.
        </p>
      </div>
    </div>
  );
}
