import { NextResponse } from 'next/server';
import { getEmployees } from '@/data/employeeStore';

// In-memory certificates store
const certificates = [
    {
        id: 'CERT-001',
        employeeId: 1,
        employeeName: 'Ahmad Fauzi',
        namaPelatihan: 'Workshop Penguatan Kapasitas HAM',
        tanggalUpload: '2026-02-10',
        jp: 20,
        status: 'approved',
    },
    {
        id: 'CERT-002',
        employeeId: 2,
        employeeName: 'Siti Nurhaliza',
        namaPelatihan: 'Bimtek Transformasi Digital',
        tanggalUpload: '2026-02-15',
        jp: 24,
        status: 'pending',
    },
    {
        id: 'CERT-003',
        employeeId: 3,
        employeeName: 'Budi Santoso',
        namaPelatihan: 'Pelatihan Analisis Kebijakan Publik',
        tanggalUpload: '2026-02-18',
        jp: 16,
        status: 'pending',
    },
    {
        id: 'CERT-004',
        employeeId: 5,
        employeeName: 'Rizky Pratama',
        namaPelatihan: 'Diklat Pelayanan Publik',
        tanggalUpload: '2026-02-20',
        jp: 12,
        status: 'pending',
    },
    {
        id: 'CERT-005',
        employeeId: 11,
        employeeName: 'Agus Purnomo',
        namaPelatihan: 'Workshop Manajemen SDM Aparatur',
        tanggalUpload: '2026-02-22',
        jp: 20,
        status: 'pending',
    },
];

export async function POST() {
    return NextResponse.json({
        success: true,
        message: 'Sertifikat berhasil diupload dan sedang dalam proses verifikasi.',
        id: `CERT-${Date.now()}`,
        status: 'pending',
    });
}

export async function GET() {
    return NextResponse.json(certificates);
}

export async function PUT(request: Request) {
    try {
        const employees = getEmployees();
        const { certificateId, action } = await request.json();

        const certIdx = certificates.findIndex(c => c.id === certificateId);
        if (certIdx === -1) {
            return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
        }

        const cert = certificates[certIdx];

        if (action === 'approve') {
            certificates[certIdx] = { ...cert, status: 'approved' };

            // Find and update the employee JP in the shared store
            const empIdx = employees.findIndex(e => e.id === cert.employeeId);
            if (empIdx !== -1) {
                employees[empIdx] = {
                    ...employees[empIdx],
                    jumlahJP: employees[empIdx].jumlahJP + cert.jp,
                };
            }

            return NextResponse.json({
                success: true,
                certificate: certificates[certIdx],
                employeeUpdated: empIdx !== -1,
                newJP: empIdx !== -1 ? employees[empIdx].jumlahJP : null,
                message: `Sertifikat berhasil diverifikasi. JP ${cert.employeeName} bertambah ${cert.jp} JP.`,
            });
        } else if (action === 'reject') {
            certificates[certIdx] = { ...cert, status: 'rejected' };
            return NextResponse.json({
                success: true,
                certificate: certificates[certIdx],
                message: 'Sertifikat ditolak.',
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
