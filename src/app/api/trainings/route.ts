import { NextResponse } from 'next/server';
import trainings from '@/data/trainings.json';

export async function GET() {
    return NextResponse.json(trainings);
}
