
import React, { useState } from 'react';
import api from '../services/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: any) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      window.location.href = '/';
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'فشل في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(120deg,#f0f4f8 0%,#e0e7ff 100%)'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: '40px 32px',
        minWidth: 340,
        maxWidth: 380
      }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 24,
          textAlign: 'center',
          color: '#3b3b3b',
          letterSpacing: 1
        }}>تسجيل دخول النظام المركزي</h2>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 16, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>اسم المستخدم</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 16,
                borderRadius: 8,
                border: '1px solid #d1d5db',
                outline: 'none',
                background: '#f9fafb',
                marginBottom: 2
              }}
              // autoFocus محذوف بناءً على طلب المستخدم
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 16, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 16,
                borderRadius: 8,
                border: '1px solid #d1d5db',
                outline: 'none',
                background: '#f9fafb',
                marginBottom: 2
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 0',
              fontSize: 18,
              fontWeight: 600,
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
              transition: 'background 0.2s'
            }}
          >{loading ? '...جاري الدخول' : 'دخول'}</button>
          {error && <div style={{ color: '#e11d48', marginTop: 16, fontSize: 15, textAlign: 'center' }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}
