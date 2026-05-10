'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

interface Certificate {
    id: string;
    namaPelatihan: string;
    tanggal: string;
    jp: number;
    fileUrl?: string;
}

function RincianContent() {
    const searchParams = useSearchParams();
    const [nama, setNama] = useState<string>('');
    const [nip, setNip] = useState<string>('');
    const [totalJp, setTotalJp] = useState<number>(0);
    const [certificates, setCertificates] = useState<Certificate[]>([]);

    // Change password state
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailStr, setEmailStr] = useState('');
    const [changePasswordError, setChangePasswordError] = useState('');
    const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

    const generateDefaultPassword = (namaStr: string, nipStr: string) => {
        const firstName = namaStr.split(' ')[0];
        const first3 = firstName.substring(0, 3).toLowerCase();
        const first4nip = nipStr.substring(0, 4);
        return first3 + first4nip;
    };

    const getCurrentPassword = (namaStr: string, nipStr: string) => {
        const stored = localStorage.getItem(`rincian_password_${namaStr}`);
        if (stored) return stored;
        return generateDefaultPassword(namaStr, nipStr);
    };

    const handleChangePassword = async () => {
        setChangePasswordError('');
        setChangePasswordSuccess(false);

        const currentPassword = getCurrentPassword(nama, nip);
        if (oldPassword !== currentPassword) {
            setChangePasswordError('Password lama salah.');
            return;
        }
        if (newPassword.length < 4) {
            setChangePasswordError('Password baru minimal 4 karakter.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setChangePasswordError('Konfirmasi password tidak cocok.');
            return;
        }

        try {
            // Sync to Supabase
            const response = await fetch('/api/passwords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nama: nama,
                    nip: nip,
                    password: newPassword
                })
            });

            if (!response.ok) {
                throw new Error('Gagal menyinkronkan password ke database');
            }

            // Fallback for offline/local use
            localStorage.setItem(`rincian_password_${nama}`, newPassword);
            
            if (emailStr.trim()) {
                localStorage.setItem(`rincian_email_${nama}`, emailStr);
            }
            
            setChangePasswordSuccess(true);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setEmailStr('');
            setTimeout(() => {
                setShowChangePassword(false);
                setChangePasswordSuccess(false);
            }, 2000);
        } catch (err: any) {
            console.error('Error changing password:', err);
            setChangePasswordError(err.message || 'Terjadi kesalahan saat menyimpan password.');
        }
    };

    useEffect(() => {
        const urlNama = searchParams.get('nama') || 'Pegawai';
        const urlNip = searchParams.get('nip') || '';
        const urlEmpId = parseInt(searchParams.get('empId') || '0', 10);
        const baseJp = parseInt(searchParams.get('jp') || '0', 10);

        setNama(urlNama);
        setNip(urlNip);
        setTotalJp(baseJp);

        // Auto-login user if accessing this page with valid params (Session Healing)
        if (urlNama && urlNip && urlEmpId > 0) {
            const currentUserStr = localStorage.getItem('hrd_user');
            const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
            if (!currentUser || currentUser.role !== 'admin') {
                localStorage.setItem('hrd_user', JSON.stringify({
                    id: urlEmpId,
                    email: '',
                    nama: urlNama,
                    nip: urlNip,
                    isRegistered: true,
                    role: 'user'
                }));
            }
        }

        // Fetch real certificates from Supabase (only approved ones for this employee)
        const fetchCertificates = async () => {
            try {
                const res = await fetch('/api/certificates');
                const data = await res.json();
                // Filter: only approved certificates for this employee
                // Match by employeeId (most reliable) OR by name (case-insensitive, trimmed)
                const myCerts = (data || [])
                    .filter((c: { employeeId: number; employeeName: string; status: string }) => {
                        if (c.status !== 'approved') return false;
                        // Match by employee ID if available
                        if (urlEmpId > 0 && c.employeeId === urlEmpId) return true;
                        // Fallback: match by name (case-insensitive)
                        const certName = (c.employeeName || '').trim().toLowerCase();
                        const pageName = urlNama.trim().toLowerCase();
                        return certName === pageName || certName.includes(pageName) || pageName.includes(certName);
                    })
                    .map((c: { id: string; namaPelatihan: string; tanggalUpload: string; jp: number; fileUrl?: string }) => ({
                        id: c.id,
                        namaPelatihan: c.namaPelatihan,
                        tanggal: c.tanggalUpload,
                        jp: c.jp,
                        fileUrl: c.fileUrl,
                    }));
                setCertificates(myCerts);
                // Total JP = strictly the sum of all approved certificates
                const totalCertsJp = myCerts.reduce((sum: number, c: Certificate) => sum + c.jp, 0);
                setTotalJp(totalCertsJp);
            } catch (err) {
                console.error('Failed to fetch certificates:', err);
            }
        };
        fetchCertificates();
    }, [searchParams]);

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Back Button */}
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => window.history.back()}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '10px',
                        padding: '10px 20px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#f0f4ff', fontSize: '14px', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                >
                    <i className="fas fa-arrow-left" style={{ fontSize: '12px' }}></i>
                    Kembali
                </button>
            </div>

            {/* Header Details */}
            <div className="glass-card animate-fade-in-up" style={{ padding: '32px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '16px',
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#34d399', fontSize: '24px',
                            border: '1px solid rgba(16,185,129,0.2)'
                        }}>
                            <i className="fas fa-file-certificate"></i>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Rincian Sertifikat</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                Atas nama <strong style={{ color: 'var(--text-primary)' }}>{nama}</strong>
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => { setShowChangePassword(true); setChangePasswordError(''); setChangePasswordSuccess(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); setEmailStr(''); }} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '10px',
                            background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
                            color: '#fbbf24', fontSize: '14px', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                            <i className="fas fa-key"></i> Ubah Password
                        </button>
                        <a href="/dashboard/upload" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '10px',
                            background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)',
                            color: '#818cf8', fontSize: '14px', fontWeight: 600,
                            textDecoration: 'none', transition: 'all 0.2s',
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                            <i className="fas fa-upload"></i> Upload Sertifikat
                        </a>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fas fa-book" style={{ color: '#818cf8' }}></i> Total Jam Pelajaran
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: totalJp >= 20 ? '#10b981' : totalJp >= 10 ? '#f59e0b' : '#ef4444' }}>
                            {totalJp} <span style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>JP</span>
                        </div>
                    </div>
                    <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fas fa-layer-group" style={{ color: '#818cf8' }}></i> Jumlah Sertifikat
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {certificates.length} <span style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Sertifikat</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* List of Dummy Certificates */}
            <div className="glass-card animate-fade-in-up stagger-2" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px' }}>
                    <i className="fas fa-list-check" style={{ marginRight: '8px', color: '#818cf8' }}></i>
                    Daftar Sertifikat Terverifikasi
                </h3>

                {certificates.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <i className="fas fa-inbox" style={{ fontSize: '36px', color: 'var(--text-secondary)', opacity: 0.3, marginBottom: '12px', display: 'block' }}></i>
                        <p style={{ color: 'var(--text-secondary)' }}>Tidak ada sertifikat (0 JP).</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {certificates.map((cert) => (
                            <div key={cert.id} style={{
                                padding: '20px', borderRadius: '16px',
                                background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                transition: 'all 0.3s', cursor: 'pointer'
                            }}
                                onClick={() => {
                                    if (cert.fileUrl) {
                                        window.open(cert.fileUrl, '_blank');
                                    } else {
                                        alert('File PDF tidak tersedia untuk sertifikat ini (mungkin diunggah sebelum fitur penyimpanan file diaktifkan).');
                                    }
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#818cf8', fontSize: '20px'
                                    }}>
                                        <i className="fas fa-award"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                            ID: {cert.id}
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                                            {cert.namaPelatihan}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            <i className="fas fa-calendar" style={{ marginRight: '6px', opacity: 0.7 }}></i>
                                            {new Date(cert.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '12px 20px', borderRadius: '12px',
                                    background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <span style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', lineHeight: 1 }}>{cert.jp}</span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399', opacity: 0.8, marginTop: '2px' }}>JP</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>



            {/* Change Password Modal */}
            {showChangePassword && (
                <div className="modal-overlay" onClick={() => setShowChangePassword(false)} style={{ zIndex: 1001 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', maxWidth: '420px', width: '90vw', padding: '32px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fbbf24', fontSize: '24px' }}>
                                <i className="fas fa-key"></i>
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f0f4ff', marginBottom: '8px' }}>Ubah Password</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                Ubah password akses rincian untuk <strong style={{ color: '#f0f4ff' }}>{nama}</strong>
                            </p>
                        </div>

                        {changePasswordSuccess ? (
                            <div style={{ textAlign: 'center', padding: '20px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                <i className="fas fa-check-circle" style={{ fontSize: '36px', color: '#10b981', marginBottom: '12px', display: 'block' }}></i>
                                <p style={{ color: '#34d399', fontWeight: 600 }}>Password berhasil diubah!</p>
                            </div>
                        ) : (
                            <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Password Lama</label>
                                        <input type="password" value={oldPassword} onChange={(e) => { setOldPassword(e.target.value); setChangePasswordError(''); }} placeholder="Masukkan password lama" className="input-field" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Password Baru</label>
                                        <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setChangePasswordError(''); }} placeholder="Masukkan password baru" className="input-field" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Konfirmasi Password Baru</label>
                                        <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setChangePasswordError(''); }} placeholder="Ulangi password baru" className="input-field" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                        <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Baru</label>
                                        <input type="email" value={emailStr} onChange={(e) => { setEmailStr(e.target.value); setChangePasswordError(''); }} placeholder="Masukkan email baru (opsional)" className="input-field" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                    </div>
                                </div>
                                </div>
                                {changePasswordError && (
                                    <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '12px', textAlign: 'center' }}>
                                        <i className="fas fa-exclamation-circle" style={{ marginRight: '4px' }}></i>{changePasswordError}
                                    </p>
                                )}
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button type="button" onClick={() => setShowChangePassword(false)} style={{
                                        flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                    }}>Batal</button>
                                    <button type="submit" className="shimmer-btn" style={{ flex: 1, padding: '12px', fontSize: '14px' }}>
                                        <i className="fas fa-save" style={{ marginRight: '8px' }}></i>Simpan
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RincianPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', minHeight: '400px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--gradient-1)', margin: 'auto' }}></i>
            </div>
        }>
            <RincianContent />
        </Suspense>
    );
}
