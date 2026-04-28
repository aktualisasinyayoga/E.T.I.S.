import employeesData from '@/data/employees.json';

// Use globalThis to share the employee store across all API routes
// Module-level variables may not be shared in Next.js Turbopack dev mode
const GLOBAL_KEY = '__EMPLOYEE_STORE_V6__' as const;

interface EmployeeRecord {
    id: number;
    nama: string;
    nip: string;
    email: string;
    unitKerja: string;
    pangkat: string;
    golongan: string;
    jabatan: string;
    jumlahJP: number;
}

declare global {
    // eslint-disable-next-line no-var
    var __EMPLOYEE_STORE_V6__: EmployeeRecord[] | undefined;
}

export function getEmployees(): EmployeeRecord[] {
    if (!globalThis[GLOBAL_KEY]) {
        globalThis[GLOBAL_KEY] = [...employeesData];
    }
    return globalThis[GLOBAL_KEY];
}
