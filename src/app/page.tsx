'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const sections = [
  { id: 'hero', gradient: 'linear-gradient(135deg, #0a0e1a 0%, #1a1040 50%, #0d1f3c 100%)', orbColors: ['#6366f1', '#8b5cf6'] },
  { id: 'nav', gradient: 'linear-gradient(135deg, #0a0e1a 0%, #0d1a2e 50%, #0a1628 100%)', orbColors: ['#6366f1', '#06b6d4'] },
];

type ViewId = 'units' | 'kanwil' | 'pkp' | 'pka' | 'pkn1' | 'pkn2' | 'lainnya' | null;

const navCardGroups = [
  {
    label: 'Prioritas Calon Peserta Pelatihan',
    icon: 'fa-users',
    accentColor: '#06b6d4',
    cards: [
      { viewId: 'units' as ViewId, icon: 'fa-landmark', title: 'Prioritas Unit Kerja Pusat', description: 'Lihat data kompetensi dan capaian JP pegawai di setiap unit kerja pusat Kementerian.', color: '#06b6d4', gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.08))' },
      { viewId: 'kanwil' as ViewId, icon: 'fa-map-marker-alt', title: 'Prioritas Kantor Wilayah', description: 'Pantau progress pelatihan dan pencapaian JP di seluruh kantor wilayah.', color: '#3b82f6', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.08))' },
    ],
  },
  {
    label: 'Jadwal dan Informasi Pelatihan',
    icon: 'fa-graduation-cap',
    accentColor: '#8b5cf6',
    cards: [
      { viewId: 'pkp' as ViewId, icon: 'fa-user-tie', title: 'Pelatihan Kepemimpinan Pengawas (PKP)', description: 'Jadwal dan informasi pelatihan kepemimpinan tingkat pengawas.', color: '#6366f1', gradient: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.08))' },
      { viewId: 'pka' as ViewId, icon: 'fa-user-shield', title: 'Pelatihan Kepemimpinan Administrator (PKA)', description: 'Jadwal dan informasi pelatihan kepemimpinan tingkat administrator.', color: '#8b5cf6', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(167,139,250,0.08))' },
      { viewId: 'pkn1' as ViewId, icon: 'fa-chess-king', title: 'Pelatihan Kepemimpinan Nasional I (PKN I)', description: 'Jadwal dan informasi pelatihan kepemimpinan nasional tingkat I.', color: '#ec4899', gradient: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(244,114,182,0.08))' },
      { viewId: 'pkn2' as ViewId, icon: 'fa-chess-queen', title: 'Pelatihan Kepemimpinan Nasional II (PKN II)', description: 'Jadwal dan informasi pelatihan kepemimpinan nasional tingkat II.', color: '#06b6d4', gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(34,211,238,0.08))' },
      { viewId: 'lainnya' as ViewId, icon: 'fa-layer-group', title: 'Pelatihan Lain-lain', description: 'Jadwal pelatihan lainnya yang tidak termasuk dalam kategori PKP, PKA, PKN.', color: '#10b981', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.08))' },
    ],
  },
];

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

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);

  // Data States
  const [units, setUnits] = useState<UnitStat[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);

  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedUnitLabel, setSelectedUnitLabel] = useState<string>('');
  const [searchTraining, setSearchTraining] = useState('');
  const [searchPusat, setSearchPusat] = useState('');
  const [searchKanwil, setSearchKanwil] = useState('');
  const [searchModalEmp, setSearchModalEmp] = useState('');
  const [searchPKP, setSearchPKP] = useState('');
  const [searchPKA, setSearchPKA] = useState('');
  const [searchPKNI, setSearchPKNI] = useState('');
  const [searchPKNII, setSearchPKNII] = useState('');
  const [searchLainnya, setSearchLainnya] = useState('');

  // Active expanded view
  const [activeView, setActiveView] = useState<ViewId>(null);

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
      window.location.href = `/dashboard/rincian?nama=${encodeURIComponent(pendingRincianEmp.nama)}&nip=${encodeURIComponent(pendingRincianEmp.nip)}&jp=${pendingRincianEmp.jumlahJP}`;
    } else {
      setPasswordError('Password salah. Silakan coba lagi.');
    }
  };

  // Admin login modal
  const router = useRouter();
  const { login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleAdminLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    try {
      // Simulate slight delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));

      if (adminKey === 'ppsdmjaya') {
        const mockAdminUser = {
          name: 'Administrator',
          email: 'admin@kemenkumham.go.id',
          role: 'admin',
          avatarUrl: 'https://avatar.iran.liara.run/public/boy?username=admin'
        };
        localStorage.setItem('hrd_user', JSON.stringify(mockAdminUser));

        // Use full navigation instead of router.push to avoid GSAP DOM conflicts
        window.location.href = '/dashboard/admin';
      } else {
        setLoginError('Administrator Key tidak valid.');
      }
    } catch {
      setLoginError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    // Fetch all required data
    Promise.all([
      fetch('/api/units').then(res => res.json()),
      fetch('/api/employees').then(res => res.json()),
      fetch('/api/trainings').then(res => res.json())
    ]).then(([uData, eData, tData]) => {
      setUnits(uData);
      setAllEmployees(eData);
      setTrainings(tData);
    }).catch(err => console.error("Error fetching data:", err));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;

      gsap.to('.orb-pos-1', { x: x * 0.5, y: y * 0.5, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
      gsap.to('.orb-pos-2', { x: x * -0.3, y: y * -0.3, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const horizontal = horizontalRef.current;
      if (!horizontal) return;

      const panels = gsap.utils.toArray<HTMLElement>('.h-panel');
      if (panels.length === 0) return;

      // Build a master timeline with normalized durations
      let totalDuration = 0;
      const segmentDurations: number[] = [];

      // Pre-calculate all segment durations
      panels.forEach((panel, index) => {
        const scrollContent = panel.querySelector('.panel-scroll-content') as HTMLElement;
        const scrollParent = scrollContent?.parentElement;
        const availableHeight = scrollParent ? scrollParent.clientHeight : panel.clientHeight;
        const vOverflow = scrollContent ? Math.max(0, scrollContent.scrollHeight - availableHeight) : 0;

        // Vertical scroll duration: proportional to overflow, normalized (1 unit = 1 viewport height of scroll)
        if (vOverflow > 0) {
          const vDuration = vOverflow / window.innerHeight;
          segmentDurations.push(vDuration);
          totalDuration += vDuration;
        }

        // Horizontal transition: 1 unit per panel
        if (index < panels.length - 1) {
          segmentDurations.push(1);
          totalDuration += 1;
        }
      });

      const scrollLength = totalDuration * window.innerHeight;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 1,
          end: () => `+=${scrollLength}`,
          invalidateOnRefresh: true,
        },
      });

      // Build the timeline segments
      let xAccum = 0;
      panels.forEach((panel, index) => {
        const scrollContent = panel.querySelector('.panel-scroll-content') as HTMLElement;
        const scrollParent = scrollContent?.parentElement;
        const availableHeight = scrollParent ? scrollParent.clientHeight : panel.clientHeight;
        const vOverflow = scrollContent ? Math.max(0, scrollContent.scrollHeight - availableHeight) : 0;

        // Vertical scroll segment
        if (vOverflow > 0) {
          const vDuration = vOverflow / window.innerHeight;
          tl.to(scrollContent, { y: -vOverflow, ease: 'none', duration: vDuration });
        }

        // Horizontal transition segment
        if (index < panels.length - 1) {
          xAccum += panel.offsetWidth;
          tl.to(horizontal, { x: -xAccum, ease: 'none', duration: 1 });
        }
      });

      // Entry animations
      panels.forEach((panel, index) => {
        const els = panel.querySelectorAll('.panel-anim');
        const orbs = panel.querySelectorAll('.panel-orb');
        const counter = panel.querySelector('.section-counter');
        const line = panel.querySelector('.reveal-line');

        const delayOrScroll = index === 0 ? { delay: 0.2 } : {
          scrollTrigger: {
            trigger: panel,
            containerAnimation: tl,
            start: 'left 80%',
            end: 'left 30%',
            toggleActions: 'play none none reverse',
          }
        };

        gsap.fromTo(els, { opacity: 0, y: 60 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out', ...delayOrScroll });
        gsap.fromTo(orbs, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 0.15, duration: 1.2, ease: 'power2.out', ...delayOrScroll });

        if (counter) {
          gsap.fromTo(counter, { opacity: 0, x: -30 }, { opacity: 0.15, x: 0, duration: 1, ease: 'power2.out', ...delayOrScroll });
        }
        if (line) {
          gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power3.inOut', ...delayOrScroll });
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, [units, allEmployees, trainings]); // Re-run GSAP logic once data is fetched to adjust scroll lengths

  // Helper Functions
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
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const filteredTrainings = trainings.filter(t => t.nama.toLowerCase().includes(searchTraining.toLowerCase()) || t.tempat.toLowerCase().includes(searchTraining.toLowerCase()));
  const filteredPusat = units.filter(u => u.tipe === 'pusat' && (u.nama.toLowerCase().includes(searchPusat.toLowerCase()) || u.singkatan.toLowerCase().includes(searchPusat.toLowerCase())));
  const filteredKanwil = units.filter(u => u.tipe === 'kanwil' && (u.nama.toLowerCase().includes(searchKanwil.toLowerCase()) || u.singkatan.toLowerCase().includes(searchKanwil.toLowerCase())));

  // Render Functions
  const renderUnitCard = (unit: UnitStat) => {
    const status = getStatusBadge(unit.ratio);
    const progressColor = getProgressColor(unit.ratio);
    return (
      <div key={unit.id} className="glass-card" onClick={() => { setSelectedUnitId(unit.id); setSelectedUnitLabel(unit.singkatan + ' — ' + unit.nama); }} style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${progressColor}20, ${progressColor}10)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: progressColor, fontSize: '16px', border: `1px solid ${progressColor}30`,
            }}>
              <i className={`fas ${unit.tipe === 'pusat' ? 'fa-landmark' : 'fa-map-marker-alt'}`}></i>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f0f4ff' }}>{unit.singkatan}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{unit.nama}</div>
            </div>
          </div>
          <span className={`badge ${status.className}`}>{status.text}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
          <span style={{ fontSize: '32px', fontWeight: 800, color: progressColor }}>{unit.tercapai20JP}</span>
          <span style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>/ {unit.totalPegawai}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '4px' }}>pegawai</span>
        </div>
        <div className="progress-bar-bg" style={{ height: '8px', marginBottom: '12px' }}>
          <div className="progress-bar-fill" style={{ width: `${Math.round(unit.ratio * 100)}%`, background: `linear-gradient(90deg, ${progressColor}, ${progressColor}cc)` }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{Math.round(unit.ratio * 100)}% tercapai</span>
        </div>
      </div>
    );
  };

  const renderTrainingCard = (training: Training) => (
    <div key={training.id} className="glass-card" onClick={() => setSelectedTraining(training)} style={{ padding: '24px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: '18px' }}>
          <i className="fas fa-graduation-cap"></i>
        </div>
        <span className={`badge ${training.status === 'Pendaftaran Dibuka' ? 'badge-success' : 'badge-warning'}`}>{training.status}</span>
      </div>
      <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', lineHeight: 1.4, color: '#f0f4ff' }}>{training.nama}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <i className="fas fa-map-marker-alt" style={{ width: '16px', textAlign: 'center', color: '#818cf8', fontSize: '12px' }}></i>
          {training.tempat}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <i className="fas fa-calendar" style={{ width: '16px', textAlign: 'center', color: '#818cf8', fontSize: '12px' }}></i>
          {formatDate(training.tanggalMulai)}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fas fa-book" style={{ fontSize: '11px', color: 'var(--gradient-4)' }}></i>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f0f4ff' }}>{training.jp} JP</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fas fa-users" style={{ fontSize: '11px', color: 'var(--gradient-4)' }}></i>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Kuota {training.kuota} org</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div ref={containerRef} style={{ overflow: 'hidden' }}>
        <div ref={horizontalRef} style={{ display: 'flex', width: 'fit-content', height: '100vh', pointerEvents: selectedTraining ? 'none' : 'auto' }}>

          {/* ===== PANEL 1: HERO ===== */}
          <section className="h-panel" style={{ width: '100vw', height: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>

            {/* Background Image Setup */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/hero-bg-new.png')", backgroundSize: 'cover', backgroundPosition: 'top center', zIndex: -2 }} />

            {/* Optional Overlay if needed for contrast */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10, 14, 26, 0.4)', zIndex: -1 }} />

            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />


            <div style={{ position: 'absolute', top: '0%', left: '50%', transform: 'translateX(-50%)', zIndex: 1, textAlign: 'center', padding: '0 24px', width: '100%', maxWidth: '550px' }}>
              <div className="panel-anim" style={{ margin: '0 auto' }}>
                {/* PPSDM Logo — Clickable for Admin Login */}
                <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '8px' }}>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, margin: 0, outline: 'none', display: 'inline-flex', verticalAlign: 'middle', width: 'fit-content' }}
                    title="Admin Login"
                  >
                    <img src="/PPSDM_LOGO.png" alt="Logo PPSDM" style={{ display: 'block', height: '180px', width: 'auto', filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.6))', transition: 'transform 0.2s' }} />
                  </button>
                </div>
                <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 800, lineHeight: 1.2, color: '#FFD700', textShadow: '0px 2px 4px rgba(0,0,0,0.8), 0px 4px 12px rgba(0,0,0,0.6)', letterSpacing: '2px', WebkitTextStroke: '3.5px #1B2A4A', paintOrder: 'stroke fill' }}>
                  E.T.I.S
                </h2>
                <div style={{ marginTop: '10px' }}>
                  <p style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', color: '#FFD700', fontWeight: 700, letterSpacing: '1px', textShadow: '0px 2px 4px rgba(0,0,0,0.8), 0px 4px 12px rgba(0,0,0,0.6)', marginBottom: '4px', WebkitTextStroke: '2px #1B2A4A', paintOrder: 'stroke fill' }}>
                    Employee Training Information System
                  </p>
                  <p style={{ fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)', color: '#FFD700', fontWeight: 500, fontStyle: 'italic', textShadow: '0px 2px 4px rgba(0,0,0,0.8), 0px 4px 12px rgba(0,0,0,0.6)', WebkitTextStroke: '1.5px #1B2A4A', paintOrder: 'stroke fill' }}>
                    (Sistem Informasi Pelatihan Pegawai)
                  </p>
                </div>
                
                {/* Tombol User Guide */}
                <div style={{ marginTop: '24px' }}>
                  <a 
                    href="/UserGuide.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '12px 24px', 
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff', 
                      borderRadius: '50px', 
                      fontWeight: 600, 
                      fontSize: '14px', 
                      textDecoration: 'none', 
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <i className="fas fa-file-pdf" style={{ color: '#ef4444', fontSize: '16px' }}></i>
                    User Guide
                  </a>
                </div>
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 1, textAlign: 'center', padding: '0 24px', width: '100%' }}>

              <div className="panel-anim">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                  <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.8))' }} />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#FFD700', letterSpacing: '4px', textTransform: 'uppercase', textShadow: '0px 2px 8px rgba(0,0,0,0.9), 0px 4px 16px rgba(0,0,0,0.6)', WebkitTextStroke: '1.5px #1B2A4A', paintOrder: 'stroke fill' }}>Scroll untuk Mengeksplorasi</span>
                  <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, rgba(255,215,0,0.8), transparent)' }} />
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '10px', justifyContent: 'center', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))' }}>
                  <i className="fas fa-angle-right" style={{ color: '#FFD700', fontSize: '18px', animation: 'pulse 1.5s ease infinite', animationDelay: '0s' }}></i>
                  <i className="fas fa-angle-right" style={{ color: '#FFD700', fontSize: '18px', animation: 'pulse 1.5s ease infinite', animationDelay: '0.2s' }}></i>
                  <i className="fas fa-angle-right" style={{ color: '#FFD700', fontSize: '18px', animation: 'pulse 1.5s ease infinite', animationDelay: '0.4s' }}></i>
                </div>
              </div>
            </div>
          </section>

          {/* ===== PANEL 2: NAVIGATION CUE CARDS ===== */}
          <section className="h-panel" style={{ width: '100vw', height: '100vh', background: sections[1].gradient, position: 'relative', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="panel-orb orb-pos-1" style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', filter: 'blur(120px)', background: `linear-gradient(135deg, ${sections[1].orbColors[0]}, ${sections[1].orbColors[1]})`, top: '-10%', right: '-5%', opacity: 0, pointerEvents: 'none' }} />
            <div className="panel-orb orb-pos-2" style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', filter: 'blur(100px)', background: `linear-gradient(135deg, ${sections[1].orbColors[1]}, ${sections[1].orbColors[0]})`, bottom: '-5%', left: '-5%', opacity: 0, pointerEvents: 'none' }} />

            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1100px', padding: '0 40px' }}>
              <div className="panel-anim" style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '8px 20px', borderRadius: '100px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <i className="fas fa-compass" style={{ color: '#818cf8', fontSize: '14px' }}></i>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', letterSpacing: '2px', textTransform: 'uppercase' }}>Navigasi</span>
                </div>
                <h2 style={{ fontSize: 'clamp(1.2rem, 2vw, 1.6rem)', fontWeight: 600, fontStyle: 'italic', color: '#f0f4ff', margin: '0 auto 16px', lineHeight: 1.5, maxWidth: '800px' }}>
                  &quot;Pengembangan kompetensi bukan lagi sekadar hak, tapi sudah menjadi <span style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>kewajiban</span> bagi setiap ASN.&quot;
                </h2>
                <p style={{ fontSize: '15px', color: '#818cf8', fontWeight: 700, maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
                  - UU Nomor 20 Tahun 2023 tentang Aparatur Sipil Negara -
                </p>
              </div>

              {navCardGroups.map((group, gIdx) => (
                <div key={gIdx} className="panel-anim" style={{ marginBottom: gIdx < navCardGroups.length - 1 ? '32px' : 0 }}>
                  {/* Group Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: `${group.accentColor}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: group.accentColor, fontSize: '14px',
                      border: `1px solid ${group.accentColor}25`,
                    }}>
                      <i className={`fas ${group.icon}`}></i>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0f4ff', margin: 0, letterSpacing: '0.3px' }}>{group.label}</h3>
                    <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${group.accentColor}30, transparent)`, marginLeft: '8px' }} />
                  </div>

                  {/* Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                    {group.cards.map((card, idx) => (
                      <div
                        key={idx}
                        className="nav-cue-card"
                        onClick={() => setActiveView(card.viewId)}
                        style={{
                          padding: '20px',
                          borderRadius: '14px',
                          background: card.gradient,
                          border: '1px solid rgba(255,255,255,0.06)',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                          e.currentTarget.style.borderColor = `${card.color}40`;
                          e.currentTarget.style.boxShadow = `0 8px 32px ${card.color}15`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                            background: `linear-gradient(135deg, ${card.color}25, ${card.color}10)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: card.color, fontSize: '16px',
                            border: `1px solid ${card.color}30`,
                          }}>
                            <i className={`fas ${card.icon}`}></i>
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4ff', margin: '0 0 4px', lineHeight: 1.4 }}>{card.title}</h4>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>{card.description}</p>
                          </div>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                            background: `${card.color}10`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: `${card.color}80`, fontSize: '11px',
                            alignSelf: 'center',
                          }}>
                            <i className="fas fa-arrow-right"></i>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* ===== EXPANDED VIEWS (Full-screen overlays) ===== */}
      {activeView && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1a2e 50%, #0a1628 100%)',
          display: 'flex', flexDirection: 'column',
          animation: 'fadeInView 0.3s ease-out',
        }}>
          {/* Back Button Bar */}
          <div style={{
            padding: '20px 40px',
            display: 'flex', alignItems: 'center', gap: '16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.2)',
            flexShrink: 0,
          }}>
            <button
              onClick={() => setActiveView(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 20px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#f0f4ff', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              <i className="fas fa-arrow-left" style={{ fontSize: '12px' }}></i>
              Kembali ke Navigasi
            </button>
          </div>

          {/* View Content Area */}
          <div style={{ flex: 1, overflow: 'auto', padding: '40px 80px' }}>
            {/* UNIT KERJA PUSAT VIEW */}
            {activeView === 'units' && (
              <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#f0f4ff', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                      <i className="fas fa-landmark" style={{ fontSize: '18px' }}></i>
                    </div>
                    Prioritas Unit Kerja Pusat
                  </h3>
                  <div style={{ width: '320px' }}>
                    <div style={{ position: 'relative' }}>
                      <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}></i>
                      <input type="text" value={searchPusat} onChange={(e) => setSearchPusat(e.target.value)} placeholder="Cari unit kerja pusat..." className="input-field" style={{ paddingLeft: '44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                    </div>
                    <div style={{ color: '#ffffff', fontSize: '12px', marginTop: '6px', textAlign: 'right' }}>Password Hint: NIK</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', paddingBottom: '40px' }}>
                  {filteredPusat.map(renderUnitCard)}
                </div>
              </div>
            )}

            {/* KANTOR WILAYAH VIEW */}
            {activeView === 'kanwil' && (
              <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#f0f4ff', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                      <i className="fas fa-map-marker-alt" style={{ fontSize: '18px' }}></i>
                    </div>
                    Prioritas Kantor Wilayah
                  </h3>
                  <div style={{ width: '320px' }}>
                    <div style={{ position: 'relative' }}>
                      <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}></i>
                      <input type="text" value={searchKanwil} onChange={(e) => setSearchKanwil(e.target.value)} placeholder="Cari kantor wilayah..." className="input-field" style={{ paddingLeft: '44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                    </div>
                    <div style={{ color: '#ffffff', fontSize: '12px', marginTop: '6px', textAlign: 'right' }}>Password Hint: NIK</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', paddingBottom: '40px' }}>
                  {filteredKanwil.map(renderUnitCard)}
                </div>
              </div>
            )}

            {/* PKP VIEW */}
            {activeView === 'pkp' && (
              <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#f0f4ff', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px', margin: 0 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                      <i className="fas fa-user-tie" style={{ fontSize: '18px' }}></i>
                    </div>
                    <span>Jadwal Pelatihan Kepemimpinan <span style={{ whiteSpace: 'nowrap' }}>Pengawas <span style={{ color: '#6366f1' }}>(PKP)</span></span></span>
                    <span className="badge" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '14px' }}>{trainings.filter(t => t.nama.toUpperCase().includes('PKP') && (t.nama.toLowerCase().includes(searchPKP.toLowerCase()) || t.tempat.toLowerCase().includes(searchPKP.toLowerCase()))).length}</span>
                  </h3>
                  <div style={{ width: '320px' }}>
                    <div style={{ position: 'relative' }}>
                      <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}></i>
                      <input type="text" value={searchPKP} onChange={(e) => setSearchPKP(e.target.value)} placeholder="Cari pelatihan PKP..." className="input-field" style={{ paddingLeft: '44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', paddingBottom: '40px' }}>
                  {trainings.filter(t => t.nama.toUpperCase().includes('PKP') && (t.nama.toLowerCase().includes(searchPKP.toLowerCase()) || t.tempat.toLowerCase().includes(searchPKP.toLowerCase()))).map(renderTrainingCard)}
                </div>
                {trainings.filter(t => t.nama.toUpperCase().includes('PKP') && (t.nama.toLowerCase().includes(searchPKP.toLowerCase()) || t.tempat.toLowerCase().includes(searchPKP.toLowerCase()))).length === 0 && (
                  <div style={{ padding: '32px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>Belum ada pelatihan PKP tersedia.</p>
                  </div>
                )}
              </div>
            )}

            {/* PKA VIEW */}
            {activeView === 'pka' && (
              <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#f0f4ff', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px', margin: 0 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                      <i className="fas fa-user-shield" style={{ fontSize: '18px' }}></i>
                    </div>
                    <span>Jadwal Pelatihan Kepemimpinan <span style={{ whiteSpace: 'nowrap' }}>Administrator <span style={{ color: '#8b5cf6' }}>(PKA)</span></span></span>
                    <span className="badge" style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', fontSize: '14px' }}>{trainings.filter(t => t.nama.toUpperCase().includes('PKA') && (t.nama.toLowerCase().includes(searchPKA.toLowerCase()) || t.tempat.toLowerCase().includes(searchPKA.toLowerCase()))).length}</span>
                  </h3>
                  <div style={{ width: '320px' }}>
                    <div style={{ position: 'relative' }}>
                      <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}></i>
                      <input type="text" value={searchPKA} onChange={(e) => setSearchPKA(e.target.value)} placeholder="Cari pelatihan PKA..." className="input-field" style={{ paddingLeft: '44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', paddingBottom: '40px' }}>
                  {trainings.filter(t => t.nama.toUpperCase().includes('PKA') && (t.nama.toLowerCase().includes(searchPKA.toLowerCase()) || t.tempat.toLowerCase().includes(searchPKA.toLowerCase()))).map(renderTrainingCard)}
                </div>
                {trainings.filter(t => t.nama.toUpperCase().includes('PKA') && (t.nama.toLowerCase().includes(searchPKA.toLowerCase()) || t.tempat.toLowerCase().includes(searchPKA.toLowerCase()))).length === 0 && (
                  <div style={{ padding: '32px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>Belum ada pelatihan PKA tersedia.</p>
                  </div>
                )}
              </div>
            )}

            {/* PKN I VIEW */}
            {activeView === 'pkn1' && (
              <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#f0f4ff', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px', margin: 0 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
                      <i className="fas fa-chess-king" style={{ fontSize: '18px' }}></i>
                    </div>
                    <span>Jadwal Pelatihan Kepemimpinan Nasional <span style={{ whiteSpace: 'nowrap' }}>Tingkat I <span style={{ color: '#ec4899' }}>(PKN I)</span></span></span>
                    <span className="badge" style={{ background: 'rgba(236,72,153,0.2)', color: '#f472b6', fontSize: '14px' }}>{trainings.filter(t => t.nama.toUpperCase().includes('PKN I') && !t.nama.toUpperCase().includes('PKN II') && (t.nama.toLowerCase().includes(searchPKNI.toLowerCase()) || t.tempat.toLowerCase().includes(searchPKNI.toLowerCase()))).length}</span>
                  </h3>
                  <div style={{ width: '320px' }}>
                    <div style={{ position: 'relative' }}>
                      <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}></i>
                      <input type="text" value={searchPKNI} onChange={(e) => setSearchPKNI(e.target.value)} placeholder="Cari pelatihan PKN I..." className="input-field" style={{ paddingLeft: '44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', paddingBottom: '40px' }}>
                  {trainings.filter(t => t.nama.toUpperCase().includes('PKN I') && !t.nama.toUpperCase().includes('PKN II') && (t.nama.toLowerCase().includes(searchPKNI.toLowerCase()) || t.tempat.toLowerCase().includes(searchPKNI.toLowerCase()))).map(renderTrainingCard)}
                </div>
                {trainings.filter(t => t.nama.toUpperCase().includes('PKN I') && !t.nama.toUpperCase().includes('PKN II') && (t.nama.toLowerCase().includes(searchPKNI.toLowerCase()) || t.tempat.toLowerCase().includes(searchPKNI.toLowerCase()))).length === 0 && (
                  <div style={{ padding: '32px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>Belum ada pelatihan PKN I tersedia.</p>
                  </div>
                )}
              </div>
            )}

            {/* PKN II VIEW */}
            {activeView === 'pkn2' && (
              <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#f0f4ff', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px', margin: 0 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                      <i className="fas fa-chess-queen" style={{ fontSize: '18px' }}></i>
                    </div>
                    <span>Jadwal Pelatihan Kepemimpinan Nasional <span style={{ whiteSpace: 'nowrap' }}>Tingkat II <span style={{ color: '#06b6d4' }}>(PKN II)</span></span></span>
                    <span className="badge" style={{ background: 'rgba(6,182,212,0.2)', color: '#22d3ee', fontSize: '14px' }}>{trainings.filter(t => t.nama.toUpperCase().includes('PKN II') && (t.nama.toLowerCase().includes(searchPKNII.toLowerCase()) || t.tempat.toLowerCase().includes(searchPKNII.toLowerCase()))).length}</span>
                  </h3>
                  <div style={{ width: '320px' }}>
                    <div style={{ position: 'relative' }}>
                      <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}></i>
                      <input type="text" value={searchPKNII} onChange={(e) => setSearchPKNII(e.target.value)} placeholder="Cari pelatihan PKN II..." className="input-field" style={{ paddingLeft: '44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', paddingBottom: '40px' }}>
                  {trainings.filter(t => t.nama.toUpperCase().includes('PKN II') && (t.nama.toLowerCase().includes(searchPKNII.toLowerCase()) || t.tempat.toLowerCase().includes(searchPKNII.toLowerCase()))).map(renderTrainingCard)}
                </div>
                {trainings.filter(t => t.nama.toUpperCase().includes('PKN II') && (t.nama.toLowerCase().includes(searchPKNII.toLowerCase()) || t.tempat.toLowerCase().includes(searchPKNII.toLowerCase()))).length === 0 && (
                  <div style={{ padding: '32px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>Belum ada pelatihan PKN II tersedia.</p>
                  </div>
                )}
              </div>
            )}

            {/* LAIN-LAIN VIEW */}
            {activeView === 'lainnya' && (
              <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#f0f4ff', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px', margin: 0 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                      <i className="fas fa-layer-group" style={{ fontSize: '18px' }}></i>
                    </div>
                    <span>Jadwal Pelatihan <span style={{ whiteSpace: 'nowrap', color: '#10b981' }}>Lain-lain</span></span>
                    <span className="badge" style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', fontSize: '14px' }}>{trainings.filter(t => !t.nama.toUpperCase().includes('PKP') && !t.nama.toUpperCase().includes('PKA') && !t.nama.toUpperCase().includes('PKN I') && !t.nama.toUpperCase().includes('PKN II') && (t.nama.toLowerCase().includes(searchLainnya.toLowerCase()) || t.tempat.toLowerCase().includes(searchLainnya.toLowerCase()))).length}</span>
                  </h3>
                  <div style={{ width: '320px' }}>
                    <div style={{ position: 'relative' }}>
                      <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}></i>
                      <input type="text" value={searchLainnya} onChange={(e) => setSearchLainnya(e.target.value)} placeholder="Cari pelatihan lainnya..." className="input-field" style={{ paddingLeft: '44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', paddingBottom: '40px' }}>
                  {trainings.filter(t => !t.nama.toUpperCase().includes('PKP') && !t.nama.toUpperCase().includes('PKA') && !t.nama.toUpperCase().includes('PKN I') && !t.nama.toUpperCase().includes('PKN II') && (t.nama.toLowerCase().includes(searchLainnya.toLowerCase()) || t.tempat.toLowerCase().includes(searchLainnya.toLowerCase()))).map(renderTrainingCard)}
                </div>
                {trainings.filter(t => !t.nama.toUpperCase().includes('PKP') && !t.nama.toUpperCase().includes('PKA') && !t.nama.toUpperCase().includes('PKN I') && !t.nama.toUpperCase().includes('PKN II') && (t.nama.toLowerCase().includes(searchLainnya.toLowerCase()) || t.tempat.toLowerCase().includes(searchLainnya.toLowerCase()))).length === 0 && (
                  <div style={{ padding: '32px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>Belum ada pelatihan lainnya tersedia.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Employee List Modal (from Unit Card click) */}
      {selectedUnitId && (
        <div className="modal-overlay" onClick={() => setSelectedUnitId(null)} style={{ zIndex: 10000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', maxWidth: '900px', width: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f4ff', margin: 0 }}>Prioritas Calon Peserta Pelatihan</h2>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{selectedUnitLabel}</div>
                </div>
                <button onClick={() => { setSelectedUnitId(null); setSearchModalEmp(''); }} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div style={{ alignSelf: 'flex-end', width: '300px' }}>
                <div style={{ position: 'relative' }}>
                  <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}></i>
                  <input
                    type="text"
                    value={searchModalEmp}
                    onChange={(e) => setSearchModalEmp(e.target.value)}
                    placeholder="Cari nama pegawai di unit ini..."
                    className="input-field"
                    style={{ paddingLeft: '44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead style={{ position: 'sticky', top: '-24px', background: 'var(--bg-card)', zIndex: 10 }}>
                  <tr>
                    <th>No</th>
                    <th>Nama / NIP</th>
                    <th>Pangkat/Gol</th>
                    <th>Jabatan</th>
                    <th>Total JP</th>
                    <th>Rincian Sertifikat</th>
                  </tr>
                </thead>
                <tbody>
                  {allEmployees.filter(emp => emp.unitKerja === selectedUnitId && emp.nama.toLowerCase().includes(searchModalEmp.toLowerCase())).length > 0 ? (
                    allEmployees.filter(emp => emp.unitKerja === selectedUnitId && emp.nama.toLowerCase().includes(searchModalEmp.toLowerCase())).map((emp, idx) => (
                      <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ color: '#fff' }}>{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#f0f4ff' }}>{emp.nama}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{emp.nip}</div>
                        </td>
                        <td>
                          <div style={{ color: '#e2e8f0' }}>{emp.pangkat}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{emp.golongan}</div>
                        </td>
                        <td style={{ color: '#e2e8f0' }}>{emp.jabatan}</td>
                        <td>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '18px', color: emp.jumlahJP >= 20 ? '#10b981' : emp.jumlahJP >= 10 ? '#f59e0b' : '#ef4444' }}>{emp.jumlahJP}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}> JP</span>
                          </div>
                        </td>
                        <td>
                          <button onClick={() => handleRincianClick(emp)} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                            color: '#34d399', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                          }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; }}>
                            <i className="fas fa-list"></i> Rincian
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                        Belum ada data pegawai untuk unit kerja ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal for Rincian */}
      {showPasswordModal && pendingRincianEmp && (
        <div className="modal-overlay" onClick={() => { setShowPasswordModal(false); setPasswordError(''); }} style={{ zIndex: 10001 }}>
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

      {/* Training Detail Modal */}
      {selectedTraining && (
        <div className="modal-overlay" onClick={() => setSelectedTraining(null)} style={{ zIndex: 10000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span className={`badge ${selectedTraining.status === 'Pendaftaran Dibuka' ? 'badge-success' : 'badge-warning'}`}>
                {selectedTraining.status}
              </span>
              <button onClick={() => setSelectedTraining(null)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#f0f4ff' }}>{selectedTraining.nama}</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>{selectedTraining.deskripsi}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { icon: 'fa-map-marker-alt', label: 'Tempat', value: selectedTraining.tempat },
                { icon: 'fa-calendar', label: 'Tanggal Mulai', value: formatDate(selectedTraining.tanggalMulai) },
                { icon: 'fa-calendar-check', label: 'Tanggal Selesai', value: formatDate(selectedTraining.tanggalSelesai) },
                { icon: 'fa-book', label: 'Jumlah JP', value: `${selectedTraining.jp} JP` },
                { icon: 'fa-users', label: 'Kuota', value: `${selectedTraining.kuota} peserta` },
              ].map((detail, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}><i className={`fas ${detail.icon}`} style={{ marginRight: '6px', color: '#818cf8' }}></i> {detail.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f0f4ff' }}>{detail.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)} style={{ zIndex: 9999 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card, #0f1729)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '420px', borderRadius: '20px', padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: '#818cf8', fontSize: '24px',
              }}>
                <i className="fas fa-shield-alt"></i>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f0f4ff', margin: 0 }}>Admin Login</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>Masuk sebagai administrator PPSDM</p>
            </div>

            {loginError && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px', marginBottom: '16px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171', fontSize: '13px', textAlign: 'center',
              }}>
                <i className="fas fa-exclamation-circle" style={{ marginRight: '6px' }}></i>{loginError}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', display: 'block' }}>
                <i className="fas fa-key" style={{ marginRight: '6px', color: '#818cf8', fontSize: '11px' }}></i>Administrator Key
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                placeholder="Masukkan key admin..."
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleAdminLogin}
              disabled={loginLoading || !adminKey}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                background: loginLoading || !adminKey ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #06b6d4)',
                color: '#fff', fontSize: '14px', fontWeight: 700, cursor: loginLoading || !adminKey ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {loginLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Memproses...</>
              ) : (
                <><i className="fas fa-sign-in-alt"></i> Masuk</>)}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translateX(0); }
          50% { opacity: 0.5; transform: translateX(6px); }
        }
        @keyframes fadeInView {
          from { opacity: 0; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }
        body { padding: 0 !important; }
      `}</style>
    </>
  );
}
