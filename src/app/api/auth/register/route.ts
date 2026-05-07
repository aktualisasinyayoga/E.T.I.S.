import { NextResponse } from 'next/server';
import employees from '@/data/employees.json';

export async function POST(request: Request) {
    try {
        const { nama, nip } = await request.json();

        const employee = employees.find((e) => e.nip === nip);

        if (employee) {
            const user = {
                id: employee.id,
                email: employee.email,
                nama: employee.nama,
                nip: employee.nip,
                isRegistered: true,
                role: 'user',
            };
            return NextResponse.json({ success: true, user });
        }

        return NextResponse.json({ success: false, error: 'NIP tidak ditemukan' }, { status: 404 });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
