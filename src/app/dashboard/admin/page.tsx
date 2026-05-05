'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Employee {
    id: number;
    nama: string;
    nip: string;
    email: string;
    unitKerja: string;
    pangkat: string;
    golongan: string;
    jabatan: string;
    jumlahJP: number;
}

interface Certificate {
    id: string;
    employeeId: number;
    employeeName: string;
    namaPelatihan: string;
    tanggalUpload: string;
    jp: number;
    status: string;
}

interface UnitOption {
    id: string;
    nama: string;
    singkatan: string;
}

type Tab = 'database' | 'profil' | 'sertifikat';

export default function AdminPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('database');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [units, setUnits] = useState<UnitOption[]>([]);
    const [search, setSearch] = useState('');
    const [loadingData, setLoadingData] = useState(true);

    // Modal states
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [formData, setFormData] = useState({
        nama: '', nip: '', email: '', unitKerja: '', pangkat: '', golongan: '', jabatan: '',
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<Employee | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isLoading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, isLoading, router, mounted]);

    useEffect(() => {
        if (mounted) {
            fetchAll();
        }
    }, [mounted]);

    const fetchAll = async () => {
        setLoadingData(true);
        try {
            const [empRes, certRes, unitRes] = await Promise.all([
                fetch('/api/employees'),
                fetch('/api/certificates'),
                fetch('/api/units'),
            ]);
            setEmployees(await empRes.json());
            setCertificates(await certRes.json());
            const unitData = await unitRes.json();
            setUnits(unitData.map((u: UnitOption & { tipe?: string }) => ({ id: u.id, nama: u.nama, singkatan: u.singkatan })));
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoadingData(false);
        }
    };

    const showNotif = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const getUnitName = (id: string) => {
        const unit = units.find(u => u.id === id);
        return unit ? unit.singkatan : id;
    };

    // --- EMPLOYEE CRUD ---
    const openAddForm = () => {
        setEditingEmployee(null);
        setFormData({ nama: '', nip: '', email: '', unitKerja: '', pangkat: '', golongan: '', jabatan: '' });
        setShowFormModal(true);
    };

    const openEditForm = (emp: Employee) => {
        setEditingEmployee(emp);
        setFormData({
            nama: emp.nama, nip: emp.nip, email: emp.email,
            unitKerja: emp.unitKerja, pangkat: emp.pangkat,
            golongan: emp.golongan, jabatan: emp.jabatan,
        });
        setShowFormModal(true);
    };

    const handleSubmitEmployee = async () => {
        try {
            if (editingEmployee) {
                const res = await fetch('/api/employees', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingEmployee.id, ...formData }),
                });
                const data = await res.json();
                if (data.success) {
                    showNotif('Data pegawai berhasil diperbarui!', 'success');
                    fetchAll();
                }
            } else {
                const res = await fetch('/api/employees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
                const data = await res.json();
                if (data.success) {
                    showNotif('Pegawai baru berhasil ditambahkan!', 'success');
                    fetchAll();
                }
            }
            setShowFormModal(false);
        } catch {
            showNotif('Terjadi kesalahan.', 'error');
        }
    };

    const handleDeleteEmployee = async (emp: Employee) => {
        try {
            const res = await fetch(`/api/employees?id=${emp.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showNotif(`Pegawai ${emp.nama} berhasil dihapus.`, 'success');
                fetchAll();
            }
        } catch {
            showNotif('Gagal menghapus pegawai.', 'error');
        }
        setShowDeleteConfirm(null);
    };

    // --- CERTIFICATE ---
    const handleVerifyCert = async (cert: Certificate, action: 'approve' | 'reject') => {
        try {
            const res = await fetch('/api/certificates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ certificateId: cert.id, action }),
            });
            const data = await res.json();
            if (data.success) {
                showNotif(data.message, 'success');
                fetchAll();
            } else {
                showNotif('Gagal memverifikasi sertifikat.', 'error');
            }
        } catch {
            showNotif('Gagal memverifikasi sertifikat.', 'error');
        }
    };

    const filteredEmployees = employees.filter(e =>
        e.nama.toLowerCase().includes(search.toLowerCase()) ||
        e.nip.includes(search) ||
        getUnitName(e.unitKerja).toLowerCase().includes(search.toLowerCase())
    );

    if (!mounted || isLoading || loadingData) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--gradient-1)' }}></i>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--gradient-1)' }}></i>
            </div>
        );
    }

    const tabs: { key: Tab; icon: string; label: string }[] = [
        { key: 'database', icon: 'fa-database', label: 'Database Karyawan' },
        { key: 'profil', icon: 'fa-users-cog', label: 'Manajemen Profil' },
        { key: 'sertifikat', icon: 'fa-certificate', label: 'Sertifikat Verifikator' },
    ];

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 14px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit',
    };

    return (
        <div>
            {/* Notification */}
            {notification && (
                <div style={{
                    position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
                    padding: '14px 24px', borderRadius: '12px',
                    background: notification.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${notification.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: notification.type === 'success' ? '#34d399' : '#f87171',
                    fontSize: '14px', fontWeight: 600,
                    backdropFilter: 'blur(12px)',
                    animation: 'fadeInDown 0.3s ease',
                }}>
                    <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} style={{ marginRight: '8px' }}></i>
                    {notification.message}
                </div>
            )}

            {/* Page Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f0f4ff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8',
                    }}>
                        <i className="fas fa-shield-alt" style={{ fontSize: '18px' }}></i>
                    </div>
                    Admin Panel
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Kelola data karyawan, profil, dan verifikasi sertifikat pelatihan.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => { setActiveTab(tab.key); setSearch(''); }}
                        style={{
                            padding: '10px 20px', borderRadius: '10px', border: 'none',
                            background: activeTab === tab.key ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(6,182,212,0.15))' : 'rgba(255,255,255,0.03)',
                            color: activeTab === tab.key ? '#818cf8' : 'var(--text-secondary)',
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            borderBottom: activeTab === tab.key ? '2px solid #818cf8' : '2px solid transparent',
                            transition: 'all 0.2s', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: '8px',
                        }}
                    >
                        <i className={`fas ${tab.icon}`} style={{ fontSize: '12px' }}></i>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB 1: DATABASE KARYAWAN */}
            {activeTab === 'database' && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
                            <i className="fas fa-database" style={{ marginRight: '8px', color: '#818cf8' }}></i>
                            Database Karyawan ({filteredEmployees.length})
                        </h3>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '13px' }}></i>
                            <input
                                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, NIP, atau unit kerja..."
                                className="input-field"
                                style={{ paddingLeft: '40px', ...inputStyle, width: '100%' }}
                            />
                        </div>
                    </div>
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Nama / NIP</th>
                                        <th>Unit Kerja</th>
                                        <th>Pangkat / Gol</th>
                                        <th>Jabatan</th>
                                        <th>JP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map((emp, idx) => (
                                        <tr key={emp.id}>
                                            <td>{idx + 1}</td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: '#f0f4ff' }}>{emp.nama}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{emp.nip}</div>
                                            </td>
                                            <td><span style={{ fontSize: '13px', color: '#e2e8f0' }}>{getUnitName(emp.unitKerja)}</span></td>
                                            <td>
                                                <div style={{ color: '#e2e8f0' }}>{emp.pangkat}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{emp.golongan}</div>
                                            </td>
                                            <td style={{ color: '#e2e8f0' }}>{emp.jabatan}</td>
                                            <td>
                                                <span style={{ fontWeight: 700, fontSize: '16px', color: emp.jumlahJP >= 20 ? '#10b981' : emp.jumlahJP >= 10 ? '#f59e0b' : '#ef4444' }}>
                                                    {emp.jumlahJP}
                                                </span>
                                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}> JP</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: MANAJEMEN PROFIL */}
            {activeTab === 'profil' && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
                            <i className="fas fa-users-cog" style={{ marginRight: '8px', color: '#06b6d4' }}></i>
                            Manajemen Profil Pegawai
                        </h3>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ position: 'relative', width: '250px' }}>
                                <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '13px' }}></i>
                                <input
                                    type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari pegawai..."
                                    className="input-field"
                                    style={{ paddingLeft: '40px', ...inputStyle, width: '100%' }}
                                />
                            </div>
                            <button onClick={openAddForm} style={{
                                padding: '10px 20px', borderRadius: '10px', border: 'none',
                                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap',
                                fontFamily: 'inherit',
                            }}>
                                <i className="fas fa-plus"></i> Tambah Pegawai
                            </button>
                        </div>
                    </div>
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Nama / NIP</th>
                                        <th>Unit Kerja</th>
                                        <th>Pangkat / Gol</th>
                                        <th>Jabatan</th>
                                        <th>JP</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map((emp, idx) => (
                                        <tr key={emp.id}>
                                            <td>{idx + 1}</td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: '#f0f4ff' }}>{emp.nama}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{emp.nip}</div>
                                            </td>
                                            <td><span style={{ fontSize: '13px', color: '#e2e8f0' }}>{getUnitName(emp.unitKerja)}</span></td>
                                            <td>
                                                <div style={{ color: '#e2e8f0' }}>{emp.pangkat}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{emp.golongan}</div>
                                            </td>
                                            <td style={{ color: '#e2e8f0' }}>{emp.jabatan}</td>
                                            <td>
                                                <span style={{ fontWeight: 700, fontSize: '16px', color: emp.jumlahJP >= 20 ? '#10b981' : emp.jumlahJP >= 10 ? '#f59e0b' : '#ef4444' }}>
                                                    {emp.jumlahJP}
                                                </span>
                                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}> JP</span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => openEditForm(emp)} style={{
                                                        padding: '6px 12px', borderRadius: '8px', border: 'none',
                                                        background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                                                        fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit',
                                                    }}>
                                                        <i className="fas fa-edit" style={{ fontSize: '10px' }}></i> Edit
                                                    </button>
                                                    <button onClick={() => setShowDeleteConfirm(emp)} style={{
                                                        padding: '6px 12px', borderRadius: '8px', border: 'none',
                                                        background: 'rgba(239,68,68,0.15)', color: '#f87171',
                                                        fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit',
                                                    }}>
                                                        <i className="fas fa-trash" style={{ fontSize: '10px' }}></i> Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: SERTIFIKAT VERIFIKATOR */}
            {activeTab === 'sertifikat' && (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
                            <i className="fas fa-certificate" style={{ marginRight: '8px', color: '#f59e0b' }}></i>
                            Sertifikat Verifikator
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Verifikasi sertifikat pelatihan — JP pegawai akan otomatis bertambah setelah disetujui.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: '16px' }}>
                        {certificates.map(cert => (
                            <div key={cert.id} className="glass-card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{cert.id}</span>
                                            <span className={`badge ${cert.status === 'approved' ? 'badge-success' : cert.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                                                {cert.status === 'approved' ? 'Disetujui' : cert.status === 'rejected' ? 'Ditolak' : 'Menunggu Verifikasi'}
                                            </span>
                                        </div>
                                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f0f4ff', marginBottom: '6px' }}>{cert.namaPelatihan}</h4>
                                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                <i className="fas fa-user" style={{ marginRight: '6px', color: '#818cf8', fontSize: '11px' }}></i>
                                                {cert.employeeName}
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                <i className="fas fa-calendar" style={{ marginRight: '6px', color: '#818cf8', fontSize: '11px' }}></i>
                                                {new Date(cert.tanggalUpload).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                <i className="fas fa-book" style={{ marginRight: '6px', color: '#818cf8', fontSize: '11px' }}></i>
                                                {cert.jp} JP
                                            </div>
                                        </div>
                                    </div>
                                    {cert.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleVerifyCert(cert, 'approve')} style={{
                                                padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)',
                                                background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))',
                                                color: '#34d399', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit',
                                            }}>
                                                <i className="fas fa-check"></i> Setujui
                                            </button>
                                            <button onClick={() => handleVerifyCert(cert, 'reject')} style={{
                                                padding: '8px 16px', borderRadius: '10px', border: 'none',
                                                background: 'rgba(239,68,68,0.1)',
                                                color: '#f87171', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit',
                                            }}>
                                                <i className="fas fa-times"></i> Tolak
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {certificates.length === 0 && (
                            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                                <i className="fas fa-certificate" style={{ fontSize: '32px', color: 'var(--text-secondary)', marginBottom: '12px' }}></i>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Belum ada sertifikat untuk diverifikasi.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ADD/EDIT EMPLOYEE MODAL */}
            {showFormModal && (
                <div className="modal-overlay" onClick={() => setShowFormModal(false)} style={{ zIndex: 999 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', maxWidth: '550px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
                                {editingEmployee ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
                            </h2>
                            <button onClick={() => setShowFormModal(false)} style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)',
                                color: 'var(--text-secondary)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { key: 'nama', label: 'Nama Lengkap', icon: 'fa-user' },
                                { key: 'nip', label: 'NIP', icon: 'fa-id-card' },
                                { key: 'email', label: 'Email', icon: 'fa-envelope' },
                                { key: 'pangkat', label: 'Pangkat', icon: 'fa-star' },
                                { key: 'golongan', label: 'Golongan', icon: 'fa-layer-group' },
                                { key: 'jabatan', label: 'Jabatan', icon: 'fa-briefcase' },
                            ].map(field => (
                                <div key={field.key}>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <i className={`fas ${field.icon}`} style={{ fontSize: '10px', color: '#818cf8' }}></i>
                                        {field.label}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData[field.key as keyof typeof formData]}
                                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                        placeholder={`Masukkan ${field.label.toLowerCase()}...`}
                                        style={inputStyle}
                                    />
                                </div>
                            ))}
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <i className="fas fa-building" style={{ fontSize: '10px', color: '#818cf8' }}></i>
                                    Unit Kerja
                                </label>
                                <select
                                    value={formData.unitKerja}
                                    onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value })}
                                    style={{ ...inputStyle, appearance: 'auto' }}
                                >
                                    <option value="">Pilih Unit Kerja...</option>
                                    {units.map(u => (
                                        <option key={u.id} value={u.id}>{u.singkatan} — {u.nama}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowFormModal(false)} style={{
                                padding: '10px 24px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)',
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                Batal
                            </button>
                            <button onClick={handleSubmitEmployee} style={{
                                padding: '10px 24px', borderRadius: '10px', border: 'none',
                                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                {editingEmployee ? 'Simpan Perubahan' : 'Tambah Pegawai'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM MODAL */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)} style={{ zIndex: 999 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', maxWidth: '420px', textAlign: 'center' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px', color: '#f87171', fontSize: '24px',
                        }}>
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f0f4ff', marginBottom: '8px' }}>Hapus Pegawai?</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Apakah Anda yakin ingin menghapus <strong style={{ color: '#f0f4ff' }}>{showDeleteConfirm.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button onClick={() => setShowDeleteConfirm(null)} style={{
                                padding: '10px 24px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)',
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                Batal
                            </button>
                            <button onClick={() => handleDeleteEmployee(showDeleteConfirm)} style={{
                                padding: '10px 24px', borderRadius: '10px', border: 'none',
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
