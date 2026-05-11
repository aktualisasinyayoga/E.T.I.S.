'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const menuItems = [
    { href: '/dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
    { href: '/dashboard/pelatihan', icon: 'fa-graduation-cap', label: 'Pelatihan Tersedia' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Use a microtask to avoid synchronous setState inside useEffect
        Promise.resolve().then(() => setMounted(true));
    }, []);

    const isRincianPage = pathname?.startsWith('/dashboard/rincian');
    const isUploadPage = pathname?.startsWith('/dashboard/upload');
    const hideSidebar = isRincianPage || isUploadPage;

    // Show a minimal loading shell until mounted to avoid hydration mismatch
    if (!mounted) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--gradient-1)' }}></i>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
            {/* Mobile overlay */}
            {sidebarOpen && !hideSidebar && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 35 }}
                />
            )}

            {/* Sidebar */}
            {!hideSidebar && (
                <aside
                    className={`sidebar ${sidebarOpen ? 'open' : ''}`}
                    style={{
                        width: '280px',
                        minHeight: '100vh',
                        padding: '24px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'sticky',
                        top: 0,
                        height: '100vh',
                    }}
                >
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 12px', marginBottom: '40px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, var(--gradient-1), var(--gradient-2))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0,
                        }}>
                            <i className="fas fa-shield-alt"></i>
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.3px' }}>HRD Portal</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '1px' }}>KEMENHAM</div>
                        </div>
                    </div>

                    {/* Menu Label */}
                    <div style={{ padding: '0 12px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                            Menu Utama
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <i className={`fas ${item.icon}`} style={{ width: '20px', textAlign: 'center', fontSize: '15px' }}></i>
                                {item.label}
                            </Link>
                        ))}
                        {user?.role === 'admin' && (
                            <>
                                <div style={{ padding: '12px 12px 8px', marginTop: '8px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                                        Admin
                                    </span>
                                </div>
                                <Link
                                    href="/dashboard/admin"
                                    className={`sidebar-link ${pathname === '/dashboard/admin' ? 'active' : ''}`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <i className="fas fa-shield-alt" style={{ width: '20px', textAlign: 'center', fontSize: '15px' }}></i>
                                    Admin Panel
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* User Info + Logout */}
                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', marginTop: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 12px', marginBottom: '16px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: 'linear-gradient(135deg, var(--gradient-4), var(--gradient-5))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '14px', fontWeight: 700, flexShrink: 0,
                            }}>
                                {user?.nama?.charAt(0) || 'A'}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.nama || 'Admin Publik'}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{user?.nip || '-'}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => { logout(); router.push('/'); }}
                            className="sidebar-link"
                            style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'none', fontFamily: 'inherit' }}
                        >
                            <i className="fas fa-right-from-bracket" style={{ width: '20px', textAlign: 'center', fontSize: '15px' }}></i>
                            Keluar
                        </button>
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Page Content */}
                <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                    {children}
                </div>
            </main>

            <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
          aside { position: fixed !important; }
        }
      `}</style>
        </div>
    );
}
