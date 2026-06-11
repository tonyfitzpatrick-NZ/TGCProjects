import { useNavigate } from 'react-router-dom';

export default function AdminSchedulePage() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      maxWidth: '800px', 
      margin: '0 auto' 
    }}>
      <h1 style={{ fontSize: '28px', marginBottom: '16px' }}>
        Schedule of Finishes — Master Admin
      </h1>
      
      <p style={{ fontSize: '17px', color: '#555', lineHeight: '1.6', marginBottom: '32px' }}>
        This is the dedicated admin area for managing the Schedule of Finishes.<br />
        Full functionality (CRUD for sections, items, options, templates, CBI grouping, AI research) is coming soon.
      </p>

      <button 
        onClick={() => navigate(-1)}
        style={{
          padding: '14px 28px',
          background: '#1B2B4B',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        ← Go Back
      </button>
    </div>
  );
}
