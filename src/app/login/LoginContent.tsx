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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!nip.trim()) {
            setError('NIP wajib diisi.');
            setIsLoading(false);
            return;
        }

        const result = await login(nip);

        if (result.needsRegistration) {
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
                                ? 'Masukkan NIP Anda untuk masuk ke sistem'
                                : 'Lengkapi data berikut untuk mengaktifkan akun Anda'}
                        </p>
                    </div>

                    {step === 'login' ? (
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                                    <><i className="fas fa-sign-in-alt" style={{ marginRight: '8px' }}></i> Masuk</>
                                )}
                            </button>
                        </form>
                    ) : (
                        /* Registration Form */
                        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>


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
