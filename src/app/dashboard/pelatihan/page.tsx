'use client';

import { useEffect, useState } from 'react';

interface Training {
    id: number;
    nama: string;
    tempat: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    jp: number;
    deskripsi: string;
    kuota: number;
    status: string;
}

export default function PelatihanPage() {
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);

    useEffect(() => {
        fetchTrainings();
    }, []);

    const fetchTrainings = async () => {
        try {
            const res = await fetch('/api/trainings');
            const data = await res.json();
            setTrainings(data);
        } catch (err) {
            console.error('Failed to fetch trainings:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const filtered = trainings.filter(t =>
        t.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tempat.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderTrainingCard = (training: Training, i: number) => (
        <div
            key={training.id}
            className="glass-card animate-fade-in-up"
            onClick={() => setSelectedTraining(training)}
            style={{
                padding: '24px',
                cursor: 'pointer',
                animationDelay: `${0.1 + (i % 10) * 0.05}s`,
                opacity: 0,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.15))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#818cf8', fontSize: '18px',
                }}>
                    <i className="fas fa-graduation-cap"></i>
                </div>
                <span className={`badge ${training.status === 'Pendaftaran Dibuka' ? 'badge-success' : 'badge-warning'}`}>
                    {training.status}
                </span>
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', lineHeight: 1.4 }}>
                {training.nama}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <i className="fas fa-map-marker-alt" style={{ width: '16px', textAlign: 'center', color: '#818cf8', fontSize: '12px' }}></i>
                    {training.tempat}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <i className="fas fa-calendar" style={{ width: '16px', textAlign: 'center', color: '#818cf8', fontSize: '12px' }}></i>
                    {formatDate(training.tanggalMulai)}
                    {training.tanggalMulai !== training.tanggalSelesai && ` — ${formatDate(training.tanggalSelesai)}`}
                </div>
            </div>

            <div style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fas fa-book" style={{ fontSize: '11px', color: 'var(--gradient-4)' }}></i>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{training.jp} JP</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fas fa-users" style={{ fontSize: '11px', color: 'var(--gradient-4)' }}></i>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Kuota {training.kuota} orang</span>
                </div>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--gradient-1)' }}></i>
            </div>
        );
    }

    return (
        <div>
            {/* Header Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {[
                    { icon: 'fa-calendar-check', label: 'Total Pelatihan', value: trainings.length, color: 'var(--gradient-1)' },
                    { icon: 'fa-door-open', label: 'Pendaftaran Dibuka', value: trainings.filter(t => t.status === 'Pendaftaran Dibuka').length, color: '#10b981' },
                    { icon: 'fa-hourglass-half', label: 'Segera Dibuka', value: trainings.filter(t => t.status === 'Segera Dibuka').length, color: '#f59e0b' },
                ].map((stat, i) => (
                    <div key={i} className="glass-card animate-fade-in-up" style={{ padding: '20px', animationDelay: `${i * 0.1}s`, opacity: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: `${stat.color}15`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: stat.color, fontSize: '14px',
                            }}>
                                <i className={`fas ${stat.icon}`}></i>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stat.label}</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 800 }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <i className="fas fa-search" style={{
                        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--text-secondary)', fontSize: '14px',
                    }}></i>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari pelatihan..."
                        className="input-field"
                        style={{ paddingLeft: '44px' }}
                    />
                </div>
            </div>

            {/* Training Categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {[
                    {
                        title: 'Pelatihan Kepemimpinan Pengawas (PKP)',
                        icon: 'fa-user-tie',
                        color: 'var(--gradient-1)',
                        data: filtered.filter(t => t.nama.toUpperCase().includes('PKP'))
                    },
                    {
                        title: 'Pelatihan Kepemimpinan Administrator (PKA)',
                        icon: 'fa-user-shield',
                        color: 'var(--gradient-2)',
                        data: filtered.filter(t => t.nama.toUpperCase().includes('PKA'))
                    },
                    {
                        title: 'Pelatihan Kepemimpinan Nasional Tingkat I (PKN I)',
                        icon: 'fa-chess-king',
                        color: 'var(--gradient-3)',
                        data: filtered.filter(t => t.nama.toUpperCase().includes('PKN I') && !t.nama.toUpperCase().includes('PKN II'))
                    },
                    {
                        title: 'Pelatihan Kepemimpinan Nasional Tingkat II (PKN II)',
                        icon: 'fa-chess-queen',
                        color: 'var(--gradient-4)',
                        data: filtered.filter(t => t.nama.toUpperCase().includes('PKN II'))
                    },
                    {
                        title: 'Lain-lain',
                        icon: 'fa-layer-group',
                        color: '#10b981',
                        data: filtered.filter(t =>
                            !t.nama.toUpperCase().includes('PKP') &&
                            !t.nama.toUpperCase().includes('PKA') &&
                            !t.nama.toUpperCase().includes('PKN I') &&
                            !t.nama.toUpperCase().includes('PKN II')
                        )
                    }
                ].map((category, idx) => (
                    <div key={idx}>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: category.color }}>
                                <i className={`fas ${category.icon}`} style={{ fontSize: '14px' }}></i>
                            </div>
                            {category.title}
                            <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', marginLeft: '8px' }}>{category.data.length}</span>
                        </h4>

                        {category.data.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                                {category.data.map((training, i) => renderTrainingCard(training, i))}
                            </div>
                        ) : (
                            <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-glass)', textAlign: 'center' }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Belum ada pelatihan tersedia di kategori ini.</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Training Detail Modal */}
            {selectedTraining && (
                <div className="modal-overlay" onClick={() => setSelectedTraining(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <span className={`badge ${selectedTraining.status === 'Pendaftaran Dibuka' ? 'badge-success' : 'badge-warning'}`}>
                                {selectedTraining.status}
                            </span>
                            <button
                                onClick={() => setSelectedTraining(null)}
                                style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)',
                                    color: 'var(--text-secondary)', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>{selectedTraining.nama}</h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
                            {selectedTraining.deskripsi}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            {[
                                { icon: 'fa-map-marker-alt', label: 'Tempat', value: selectedTraining.tempat },
                                { icon: 'fa-calendar', label: 'Tanggal Mulai', value: formatDate(selectedTraining.tanggalMulai) },
                                { icon: 'fa-calendar-check', label: 'Tanggal Selesai', value: formatDate(selectedTraining.tanggalSelesai) },
                                { icon: 'fa-book', label: 'Jumlah JP', value: `${selectedTraining.jp} JP` },
                                { icon: 'fa-users', label: 'Kuota', value: `${selectedTraining.kuota} peserta` },
                            ].map((detail, i) => (
                                <div key={i} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                        <i className={`fas ${detail.icon}`} style={{ marginRight: '6px', color: '#818cf8' }}></i>
                                        {detail.label}
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{detail.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
