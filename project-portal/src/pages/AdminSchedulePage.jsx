import { useNavigate } from 'react-router-dom';

export default function AdminSchedulePage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{ padding: '10px 20px', marginBottom: '30px' }}
      >
        ← Back to Settings
      </button>

      <h1 style={{ fontSize: '28px' }}>Schedule of Finishes — Master Admin</h1>
      <p style={{ fontSize: '18px', color: '#555', marginTop: '20px' }}>
        Full admin tools (add/edit/delete) are being prepared.<br />
        You can manage selections from the <strong>Project → Schedule</strong> tab.
      </p>
    </div>
  );
}
