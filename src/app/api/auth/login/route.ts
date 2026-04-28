import { NextResponse } from 'next/server';
import users from '@/data/users.json';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        const user = users.find((u) => u.email === email);

        if (user && user.isRegistered) {
            return NextResponse.json({ user, needsRegistration: false });
        }

        return NextResponse.json({ user: null, needsRegistration: true });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
