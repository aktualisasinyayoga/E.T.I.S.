import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const newCert = {
            id: body.id || `CERT-${Date.now()}`,
            employee_id: body.employeeId || 0,
            employee_name: body.employeeName || 'Unknown',
            nama_pelatihan: body.namaPelatihan || '',
            tanggal_upload: body.tanggalUpload || new Date().toISOString().split('T')[0],
            jp: body.jp || 0,
            status: 'pending',
        };

        const { data, error } = await supabase
            .from('certificates')
            .insert(newCert)
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Sertifikat berhasil diupload dan sedang dalam proses verifikasi.',
            certificate: {
                id: data.id,
                employeeId: data.employee_id,
                employeeName: data.employee_name,
                namaPelatihan: data.nama_pelatihan,
                tanggalUpload: data.tanggal_upload,
                jp: data.jp,
                status: data.status,
            },
        });
    } catch (err) {
        console.error('POST error:', err);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('certificates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase select error:', error);
            return NextResponse.json([]);
        }

        // Map snake_case DB columns to camelCase for frontend
        const certificates = (data || []).map(row => ({
            id: row.id,
            employeeId: row.employee_id,
            employeeName: row.employee_name,
            namaPelatihan: row.nama_pelatihan,
            tanggalUpload: row.tanggal_upload,
            jp: row.jp,
            status: row.status,
        }));

        return NextResponse.json(certificates);
    } catch (err) {
        console.error('GET error:', err);
        return NextResponse.json([]);
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { certificateId, action } = await request.json();

        if (action !== 'approve' && action !== 'reject') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        const { data, error } = await supabase
            .from('certificates')
            .update({ status: newStatus })
            .eq('id', certificateId)
            .select()
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
        }

        const cert = data;

        if (action === 'approve') {
            return NextResponse.json({
                success: true,
                certificate: {
                    id: cert.id,
                    employeeId: cert.employee_id,
                    employeeName: cert.employee_name,
                    namaPelatihan: cert.nama_pelatihan,
                    tanggalUpload: cert.tanggal_upload,
                    jp: cert.jp,
                    status: cert.status,
                },
                message: `Sertifikat berhasil diverifikasi. JP ${cert.employee_name} bertambah ${cert.jp} JP.`,
            });
        } else {
            return NextResponse.json({
                success: true,
                certificate: {
                    id: cert.id,
                    status: cert.status,
                },
                message: 'Sertifikat ditolak.',
            });
        }
    } catch (err) {
        console.error('PUT error:', err);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
