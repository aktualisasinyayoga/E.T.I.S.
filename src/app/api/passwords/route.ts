import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const nama = searchParams.get('nama');

    if (!nama) {
        return NextResponse.json({ error: 'Nama pegawai diperlukan' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('user_passwords')
            .select('password_hash')
            .eq('employee_nama', nama)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
            console.error('Supabase fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ 
            password: data ? data.password_hash : null 
        });
    } catch (err) {
        console.error('API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { nama, nip, password } = body;

        if (!nama || !password) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
        }

        // Use upsert to create or update the password for this employee name
        const { data, error } = await supabase
            .from('user_passwords')
            .upsert({ 
                employee_nama: nama,
                employee_nip: nip || '',
                password_hash: password,
                updated_at: new Date().toISOString()
            }, { 
                onConflict: 'employee_nama' 
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase upsert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Password berhasil disinkronkan ke database.'
        });
    } catch (err) {
        console.error('API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
