'use client';

import dynamic from 'next/dynamic';

const LoginContent = dynamic(() => import('./LoginContent'), {
    ssr: false,
    loading: () => (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0a0e1a',
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.2)',
                    borderTopColor: '#6366f1', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
                }} />
                <p style={{ color: '#8b95b0', fontSize: '14px' }}>Memuat...</p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    ),
});

export default function LoginPage() {
    return <LoginContent />;
}
