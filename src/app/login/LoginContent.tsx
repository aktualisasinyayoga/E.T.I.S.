'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginContent() {
    const router = useRouter();
    const { login, register } = useAuth();
    const [step, setStep] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [nama, setNama] = useState('');
    const [nip, setNip] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');

        // Mock Google Sign-in — use demo email
        const mockEmail = 'ahmad.fauzi@kemenkumham.go.id';
        const result = await login(mockEmail);

        if (result.needsRegistration) {
            setEmail(mockEmail);
            setStep('register');
        } else {
            router.push('/dashboard');
        }
        setIsLoading(false);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!nama.trim() || !nip.trim()) {
            setError('Nama Lengkap dan NIP wajib diisi.');
            setIsLoading(false);
            return;
        }

        const success = await register(nama, nip);
        if (success) {
            router.push('/dashboard');
        } else {
            setError('NIP tidak ditemukan dalam database. Pastikan NIP yang dimasukkan sudah benar.');
        }
        setIsLoading(false);
    };

    return (
        <div className="gradient-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Background Orbs */}
            <div className="gradient-orb gradient-orb-1 animate-float" />
            <div className="gradient-orb gradient-orb-2 animate-float" style={{ animationDelay: '2s' }} />

            {/* Grid Pattern */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)`,
                backgroundSize: '80px 80px', pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px', padding: '0 24px' }}>
                {/* Back button */}
                <button
                    onClick={() => step === 'register' ? setStep('login') : (window.location.href = '/')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        color: 'var(--text-secondary)', fontSize: '14px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        marginBottom: '32px', transition: 'color 0.3s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                    <i className="fas fa-arrow-left"></i>
                    {step === 'register' ? 'Kembali' : 'Beranda'}
                </button>

                {/* Card */}
                <div className="glass-card pulse-glow" style={{ padding: '40px', borderRadius: '24px' }}>
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '16px',
                            background: 'linear-gradient(135deg, var(--gradient-1), var(--gradient-2))',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '24px', marginBottom: '16px',
                        }}>
                            <i className="fas fa-shield-alt"></i>
                        </div>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
                            {step === 'login' ? 'Masuk ke Portal' : 'Registrasi Akun'}
                        </h1>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {step === 'login'
                                ? 'Gunakan akun Google resmi Anda untuk melanjutkan'
                                : 'Lengkapi data berikut untuk mengaktifkan akun Anda'}
                        </p>
                    </div>

                    {step === 'login' ? (
                        <>
                            {/* Google Sign-in Button */}
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                style={{
                                    width: '100%', padding: '14px 24px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: '14px', color: 'var(--text-primary)',
                                    fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                                }}
                            >
                                {isLoading ? (
                                    <i className="fas fa-spinner fa-spin"></i>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Sign in with Google
                                    </>
                                )}
                            </button>

                            {/* Demo hint */}
                            <div style={{
                                marginTop: '24px', padding: '16px',
                                background: 'rgba(99, 102, 241, 0.06)',
                                borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.12)',
                            }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, textAlign: 'center' }}>
                                    <i className="fas fa-info-circle" style={{ color: '#818cf8', marginRight: '6px' }}></i>
                                    <strong>Demo Mode:</strong> Klik tombol di atas untuk login dengan akun demo
                                </p>
                            </div>
                        </>
                    ) : (
                        /* Registration Form */
                        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    Email (Google Account)
                                </label>
                                <input
                                    type="text"
                                    value={email}
                                    disabled
                                    className="input-field"
                                    style={{ opacity: 0.6 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    Nama Lengkap <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={nama}
                                    onChange={(e) => setNama(e.target.value)}
                                    placeholder="Masukkan nama lengkap"
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    Nomor Induk Pegawai (NIP) <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={nip}
                                    onChange={(e) => setNip(e.target.value)}
                                    placeholder="Masukkan NIP"
                                    className="input-field"
                                    required
                                />
                            </div>

                            {error && (
                                <div style={{
                                    padding: '12px 16px', borderRadius: '12px',
                                    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                }}>
                                    <p style={{ fontSize: '13px', color: '#f87171' }}>
                                        <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
                                        {error}
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="shimmer-btn"
                                style={{ padding: '14px 24px', fontSize: '15px', marginTop: '4px' }}
                            >
                                {isLoading ? (
                                    <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Memproses...</>
                                ) : (
                                    <><i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i> Daftar & Masuk</>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
