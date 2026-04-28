'use client';

import { useEffect, useState } from 'react';

interface Employee {
    id: number;
    nama: string;
    nip: string;
    pangkat: string;
    golongan: string;
    jabatan: string;
    jumlahJP: number;
    unitKerja: string;
}

interface UnitStat {
    id: string;
    nama: string;
    tipe: string;
    singkatan: string;
    totalPegawai: number;
    tercapai20JP: number;
    ratio: number;
}

export default function DashboardPage() {
    const [units, setUnits] = useState<UnitStat[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<UnitStat | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalLoading, setModalLoading] = useState(false);

    // Password modal for Rincian
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [pendingRincianEmp, setPendingRincianEmp] = useState<Employee | null>(null);

    const generatePassword = (nama: string, nip: string) => {
        const firstName = nama.split(' ')[0];
        const first3 = firstName.substring(0, 3).toLowerCase();
        const first4nip = nip.substring(0, 4);
        return first3 + first4nip;
    };

    const handleRincianClick = (emp: Employee) => {
        setPendingRincianEmp(emp);
        setPasswordInput('');
        setPasswordError('');
        setShowPasswordModal(true);
    };

    const handlePasswordSubmit = () => {
        if (!pendingRincianEmp) return;
        // Check localStorage for custom password first
        const storedPassword = localStorage.getItem(`rincian_password_${pendingRincianEmp.nama}`);
        const correctPassword = storedPassword || generatePassword(pendingRincianEmp.nama, pendingRincianEmp.nip);
        if (passwordInput === correctPassword) {
            setShowPasswordModal(false);
            setPasswordInput('');
            setPasswordError('');
            window.open(`/dashboard/rincian?nama=${encodeURIComponent(pendingRincianEmp.nama)}&nip=${encodeURIComponent(pendingRincianEmp.nip)}&jp=${pendingRincianEmp.jumlahJP}`, '_blank');
        } else {
            setPasswordError('Password salah. Silakan coba lagi.');
        }
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const fetchUnits = async () => {
        try {
            const res = await fetch('/api/units');
            const data = await res.json();
            setUnits(data);
        } catch (err) {
            console.error('Failed to fetch units:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCardClick = async (unit: UnitStat) => {
        setSelectedUnit(unit);
        setModalLoading(true);
        try {
            const res = await fetch(`/api/employees?unitKerja=${unit.id}`);
            const data = await res.json();
            setEmployees(data);
        } catch (err) {
            console.error('Failed to fetch employees:', err);
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedUnit(null);
        setEmployees([]);
    };

    const getProgressColor = (ratio: number) => {
        if (ratio >= 0.7) return '#10b981';
        if (ratio >= 0.4) return '#f59e0b';
        return '#ef4444';
    };

    const getStatusBadge = (ratio: number) => {
        if (ratio >= 0.7) return { text: 'Baik', className: 'badge-success' };
        if (ratio >= 0.4) return { text: 'Sedang', className: 'badge-warning' };
        return { text: 'Perlu Perhatian', className: 'badge-danger' };
    };

    const renderUnitCard = (unit: UnitStat, i: number) => {
        const status = getStatusBadge(unit.ratio);
        const progressColor = getProgressColor(unit.ratio);

        return (
            <div
                key={unit.id}
                className="glass-card animate-fade-in-up"
                onClick={() => handleCardClick(unit)}
                style={{
                    padding: '24px',
                    cursor: 'pointer',
                    animationDelay: `${0.2 + (i % 10) * 0.05}s`,
                    opacity: 0,
                }}
            >
                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: `linear-gradient(135deg, ${progressColor}20, ${progressColor}10)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: progressColor, fontSize: '16px',
                            border: `1px solid ${progressColor}30`,
                        }}>
                            <i className={`fas ${unit.tipe === 'pusat' ? 'fa-landmark' : 'fa-map-marker-alt'}`}></i>
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700 }}>{unit.singkatan}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{unit.nama}</div>
                        </div>
                    </div>
                    <span className={`badge ${status.className}`}>{status.text}</span>
                </div>

                {/* JP Stats */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: progressColor }}>{unit.tercapai20JP}</span>
                    <span style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>/ {unit.totalPegawai}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '4px' }}>pegawai</span>
                </div>

                {/* Progress Bar */}
                <div className="progress-bar-bg" style={{ height: '8px', marginBottom: '12px' }}>
                    <div
                        className="progress-bar-fill"
                        style={{
                            width: `${Math.round(unit.ratio * 100)}%`,
                            background: `linear-gradient(90deg, ${progressColor}, ${progressColor}cc)`,
                        }}
                    />
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {Math.round(unit.ratio * 100)}% tercapai
                    </span>
                    <span style={{ fontSize: '12px', color: '#818cf8' }}>
                        Lihat Detail <i className="fas fa-arrow-right" style={{ fontSize: '10px', marginLeft: '4px' }}></i>
                    </span>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--gradient-1)' }}></i>
            </div>
        );
    }

    return (
        <div>
            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {[
                    { icon: 'fa-building', label: 'Total Unit Kerja', value: units.length, color: 'var(--gradient-1)' },
                    { icon: 'fa-users', label: 'Total Pegawai', value: units.reduce((a, u) => a + u.totalPegawai, 0), color: 'var(--gradient-4)' },
                    { icon: 'fa-check-circle', label: 'Tercapai 20 JP', value: units.reduce((a, u) => a + u.tercapai20JP, 0), color: '#10b981' },
                    { icon: 'fa-exclamation-triangle', label: 'Belum 20 JP', value: units.reduce((a, u) => a + (u.totalPegawai - u.tercapai20JP), 0), color: '#f59e0b' },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="glass-card animate-fade-in-up"
                        style={{ padding: '24px', animationDelay: `${i * 0.1}s`, opacity: 0 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '12px',
                                background: `${stat.color}15`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: stat.color, fontSize: '16px',
                            }}>
                                <i className={`fas ${stat.icon}`}></i>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</span>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 800 }}>{stat.value}</div>
                    </div>
                ))}
            </div>



            {/* Unit Cards - Pusat */}
            <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gradient-1)' }}>
                        <i className="fas fa-landmark" style={{ fontSize: '12px' }}></i>
                    </div>
                    Unit Kerja Pusat
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {units.filter(u => u.tipe === 'pusat').map((unit, i) => renderUnitCard(unit, i))}
                </div>
            </div>

            {/* Unit Cards - Kanwil */}
            <div style={{ marginTop: '32px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gradient-4)' }}>
                        <i className="fas fa-map-marker-alt" style={{ fontSize: '12px' }}></i>
                    </div>
                    Kantor Wilayah
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {units.filter(u => u.tipe === 'kanwil').map((unit, i) => renderUnitCard(unit, i))}
                </div>
            </div>

            {/* Employee Detail Modal */}
            {selectedUnit && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{selectedUnit.nama}</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    {selectedUnit.tercapai20JP} dari {selectedUnit.totalPegawai} pegawai telah mencapai 20 JP
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)',
                                    color: 'var(--text-secondary)', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.3s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Employee Table */}
                        {modalLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--gradient-1)' }}></i>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>No</th>
                                            <th>Nama</th>
                                            <th>Pangkat/Gol</th>
                                            <th>Jabatan</th>
                                            <th>JP</th>
                                            <th>Status</th>
                                            <th>Rincian Sertifikat</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map((emp, idx) => (
                                            <tr key={emp.id}>
                                                <td>{idx + 1}</td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{emp.nama}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{emp.nip}</div>
                                                </td>
                                                <td>
                                                    <div>{emp.pangkat}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{emp.golongan}</div>
                                                </td>
                                                <td>{emp.jabatan}</td>
                                                <td>
                                                    <span style={{ fontWeight: 700, fontSize: '16px', color: emp.jumlahJP >= 20 ? '#10b981' : emp.jumlahJP >= 10 ? '#f59e0b' : '#ef4444' }}>
                                                        {emp.jumlahJP}
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}> JP</span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${emp.jumlahJP >= 20 ? 'badge-success' : emp.jumlahJP >= 10 ? 'badge-warning' : 'badge-danger'}`}>
                                                        {emp.jumlahJP >= 20 ? 'Tercapai' : 'Belum'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button onClick={() => handleRincianClick(emp)} style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        padding: '6px 12px', borderRadius: '6px',
                                                        background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                                                        color: '#34d399', fontSize: '11px', fontWeight: 600,
                                                        cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                                                    }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; }}>
                                                        <i className="fas fa-list"></i> Rincian
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Password Modal for Rincian */}
            {showPasswordModal && pendingRincianEmp && (
                <div className="modal-overlay" onClick={() => { setShowPasswordModal(false); setPasswordError(''); }} style={{ zIndex: 1001 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', maxWidth: '420px', width: '90vw', padding: '32px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#818cf8', fontSize: '24px' }}>
                                <i className="fas fa-lock"></i>
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f0f4ff', marginBottom: '8px' }}>Masukkan Password</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                Masukkan password untuk melihat rincian sertifikat <strong style={{ color: '#f0f4ff' }}>{pendingRincianEmp.nama}</strong>
                            </p>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handlePasswordSubmit(); }}>
                            <div style={{ marginBottom: '16px' }}>
                                <input
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
                                    placeholder="Masukkan password..."
                                    className="input-field"
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: passwordError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)', color: '#fff', textAlign: 'center', fontSize: '16px', letterSpacing: '2px' }}
                                    autoFocus
                                />
                                {passwordError && (
                                    <p style={{ color: '#f87171', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
                                        <i className="fas fa-exclamation-circle" style={{ marginRight: '4px' }}></i>{passwordError}
                                    </p>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => { setShowPasswordModal(false); setPasswordError(''); }} style={{
                                    flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                }}>Batal</button>
                                <button type="submit" className="shimmer-btn" style={{ flex: 1, padding: '12px', fontSize: '14px' }}>
                                    <i className="fas fa-unlock" style={{ marginRight: '8px' }}></i>Buka Rincian
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
