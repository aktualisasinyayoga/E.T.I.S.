import { NextResponse } from 'next/server';
import { getEmployees } from '@/data/employeeStore';
import units from '@/data/units.json';

export async function GET() {
    const employees = getEmployees();

    const unitStats = units.map((unit) => {
        const unitEmployees = employees.filter((e) => e.unitKerja === unit.id);
        const totalPegawai = unitEmployees.length;
        const tercapai20JP = unitEmployees.filter((e) => e.jumlahJP >= 20).length;

        return {
            ...unit,
            totalPegawai,
            tercapai20JP,
            ratio: totalPegawai > 0 ? tercapai20JP / totalPegawai : 0,
        };
    });

    // Sort by completion ratio ascending (worst first)
    unitStats.sort((a, b) => a.ratio - b.ratio);

    return NextResponse.json(unitStats);
}
