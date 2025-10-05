import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
    navigate('/');
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>تسجيل الدخول</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>اسم المستخدم:</label>
          <input value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div>
          <label>كلمة المرور:</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit">دخول</button>
      </form>
    </div>
  );
};

export default LoginPage;
