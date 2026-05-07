import { NextResponse } from 'next/server';
import { getEmployees } from '@/data/employeeStore';
import { supabase } from '@/lib/supabase';
import units from '@/data/units.json';

export async function GET() {
    let employees = getEmployees();
    
    // Fetch real JP from Supabase for accurate counts
    try {
        const { data, error } = await supabase
            .from('certificates')
            .select('employee_id, jp')
            .eq('status', 'approved');
        
        if (!error && data) {
            // Group JP by employee_id
            const jpMap: Record<number, number> = {};
            data.forEach((cert) => {
                jpMap[cert.employee_id] = (jpMap[cert.employee_id] || 0) + cert.jp;
            });
            
            // Override local JSON JP with real Supabase JP
            employees = employees.map(emp => ({
                ...emp,
                jumlahJP: jpMap[emp.id] || 0
            }));
        }
    } catch (e) {
        console.error('Failed to fetch JP from Supabase', e);
    }

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
