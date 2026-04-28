import { NextRequest, NextResponse } from 'next/server';
import { getEmployees } from '@/data/employeeStore';

export async function GET(request: NextRequest) {
    const employees = getEmployees();
    const { searchParams } = new URL(request.url);
    const unitKerja = searchParams.get('unitKerja');

    let result = [...employees];

    if (unitKerja) {
        result = result.filter((e) => e.unitKerja === unitKerja);
    }

    result.sort((a, b) => a.jumlahJP - b.jumlahJP);

    return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
    const employees = getEmployees();
    try {
        const body = await request.json();
        const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
        const newEmployee = {
            id: newId,
            nama: body.nama,
            nip: body.nip,
            email: body.email || '',
            unitKerja: body.unitKerja,
            pangkat: body.pangkat,
            golongan: body.golongan,
            jabatan: body.jabatan,
            jumlahJP: body.jumlahJP || 0,
        };
        employees.push(newEmployee);
        return NextResponse.json({ success: true, employee: newEmployee });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function PUT(request: NextRequest) {
    const employees = getEmployees();
    try {
        const body = await request.json();
        const idx = employees.findIndex(e => e.id === body.id);
        if (idx === -1) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }
        employees[idx] = { ...employees[idx], ...body };
        return NextResponse.json({ success: true, employee: employees[idx] });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function DELETE(request: NextRequest) {
    const employees = getEmployees();
    try {
        const { searchParams } = new URL(request.url);
        const id = parseInt(searchParams.get('id') || '0');
        const idx = employees.findIndex(e => e.id === id);
        if (idx === -1) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }
        employees.splice(idx, 1);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
