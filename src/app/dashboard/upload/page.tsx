'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface Certificate {
    id: string;
    employeeId: number;
    employeeName: string;
    namaPelatihan: string;
    tanggalUpload: string;
    jp: number;
    status: string;
}

export default function UploadPage() {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [namaPelatihan, setNamaPelatihan] = useState('');
    const [tanggal, setTanggal] = useState('');
    const [jp, setJp] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            const res = await fetch('/api/certificates');
            const data = await res.json();
            setCertificates(data);
        } catch (err) {
            console.error('Failed to fetch certificates:', err);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && ['application/pdf', 'image/jpeg', 'image/png'].includes(droppedFile.type)) {
            setFile(droppedFile);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) setFile(selectedFile);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !namaPelatihan || !jp) return;
        
        if (!user || !user.id) {
            alert('Anda harus login terlebih dahulu untuk mengupload sertifikat.');
            return;
        }

        setIsUploading(true);
        try {
            let fileUrl = '';
            
            // Upload file to Supabase Storage
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `CERT-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('certificates')
                    .upload(fileName, file);
                
                if (uploadError) {
                    throw new Error(`Gagal mengunggah file PDF: ${uploadError.message}`);
                }
                
                const { data: publicUrlData } = supabase.storage
                    .from('certificates')
                    .getPublicUrl(fileName);
                
                fileUrl = publicUrlData.publicUrl;
            }

            const res = await fetch('/api/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: user?.id || 0,
                    employeeName: user?.nama || 'Unknown',
                    namaPelatihan,
                    tanggalUpload: tanggal || new Date().toISOString().split('T')[0],
                    jp: parseInt(jp),
                    fileUrl: fileUrl,
                }),
            });
            const data = await res.json();

            if (data.success) {
                setUploadSuccess(true);
                // Refresh the list from Supabase
                await fetchCertificates();

                // Reset form
                setTimeout(() => {
                    setFile(null);
                    setNamaPelatihan('');
                    setTanggal('');
                    setJp('');
                    setUploadSuccess(false);
                }, 3000);
            } else {
                alert(`Gagal mengupload sertifikat: ${data.error || 'Terjadi kesalahan pada server'}`);
            }
        } catch (err) {
            console.error('Upload failed:', err);
            alert(`Gagal mengupload sertifikat: Jaringan atau server bermasalah`);
        } finally {
            setIsUploading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return { text: 'Disetujui', className: 'badge-success', icon: 'fa-check-circle' };
            case 'rejected': return { text: 'Ditolak', className: 'badge-danger', icon: 'fa-times-circle' };
            default: return { text: 'Menunggu', className: 'badge-warning', icon: 'fa-clock' };
        }
    };

    return (
        <div style={{ width: '100%' }}>
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

            {/* Upload Form */}
            <div className="glass-card animate-fade-in-up" style={{ padding: '32px', marginBottom: '32px', opacity: 0 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                    <i className="fas fa-cloud-arrow-up" style={{ marginRight: '8px', color: '#818cf8' }}></i>
                    Upload Sertifikat Pelatihan
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Unggah sertifikat pelatihan yang memiliki barcode untuk menambah Jam Pelajaran (JP) Anda.
                </p>

                <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Drop Zone */}
                    <div
                        className={`drop-zone ${isDragging ? 'active' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        {file ? (
                            <div>
                                <i className="fas fa-file-check" style={{ fontSize: '36px', color: '#10b981', marginBottom: '12px', display: 'block' }}></i>
                                <p style={{ fontWeight: 600, marginBottom: '4px' }}>{file.name}</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                    style={{
                                        marginTop: '12px', padding: '6px 16px', borderRadius: '8px',
                                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                        color: '#f87171', fontSize: '12px', cursor: 'pointer',
                                    }}
                                >
                                    <i className="fas fa-trash" style={{ marginRight: '6px' }}></i>Hapus
                                </button>
                            </div>
                        ) : (
                            <div>
                                <i className="fas fa-cloud-arrow-up" style={{ fontSize: '36px', color: '#818cf8', marginBottom: '12px', display: 'block' }}></i>
                                <p style={{ fontWeight: 600, marginBottom: '4px' }}>
                                    Drag & drop file sertifikat di sini
                                </p>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    atau klik untuk memilih file (PDF, JPG, PNG)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Form Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                Nama Pelatihan <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={namaPelatihan}
                                onChange={(e) => setNamaPelatihan(e.target.value)}
                                placeholder="Masukkan nama pelatihan"
                                className="input-field"
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                Tanggal Pelatihan
                            </label>
                            <input
                                type="date"
                                value={tanggal}
                                onChange={(e) => setTanggal(e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                Jumlah JP <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="number"
                                value={jp}
                                onChange={(e) => setJp(e.target.value)}
                                placeholder="0"
                                min="1"
                                className="input-field"
                                required
                            />
                        </div>
                    </div>

                    {/* Upload Success */}
                    {uploadSuccess && (
                        <div style={{
                            padding: '16px', borderRadius: '12px',
                            background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                            display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                            <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '18px' }}></i>
                            <p style={{ fontSize: '14px', color: '#34d399' }}>
                                Sertifikat berhasil diupload dan sedang dalam proses verifikasi.
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!file || !namaPelatihan || !jp || isUploading}
                        className="shimmer-btn"
                        style={{
                            padding: '14px 24px', fontSize: '15px',
                            opacity: (!file || !namaPelatihan || !jp) ? 0.5 : 1,
                        }}
                    >
                        {isUploading ? (
                            <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Mengupload...</>
                        ) : (
                            <><i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i> Upload Sertifikat</>
                        )}
                    </button>
                </form>
            </div>

            {/* Upload History */}
            <div className="glass-card animate-fade-in-up stagger-3" style={{ padding: '32px', opacity: 0 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
                    <i className="fas fa-history" style={{ marginRight: '8px', color: '#818cf8' }}></i>
                    Riwayat Upload
                </h3>

                {certificates.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <i className="fas fa-inbox" style={{ fontSize: '36px', color: 'var(--text-secondary)', opacity: 0.3, marginBottom: '12px', display: 'block' }}></i>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Belum ada sertifikat yang diupload</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {certificates.map((cert) => {
                            const badge = getStatusBadge(cert.status);
                            return (
                                <div
                                    key={cert.id}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '16px', borderRadius: '12px',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: '1px solid rgba(255, 255, 255, 0.04)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '10px',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#818cf8', fontSize: '16px',
                                        }}>
                                            <i className="fas fa-file-certificate"></i>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{cert.namaPelatihan}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                {cert.tanggalUpload} · {cert.jp} JP
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`badge ${badge.className}`}>
                                        <i className={`fas ${badge.icon}`} style={{ marginRight: '6px', fontSize: '10px' }}></i>
                                        {badge.text}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
