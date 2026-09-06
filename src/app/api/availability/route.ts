import { NextRequest, NextResponse } from 'next/server';
import { getAvailability, setAvailability, liftCooldown } from '@/lib/db/availability';
import { checkAdminAuth } from '@/lib/auth/admin-auth';

// GET: Returns the current commission availability
export async function GET() {
    try {
        const data = await getAvailability();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching availability:', error);
        return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }
}

// POST: Updates the commission availability (Requires Admin Auth)
export async function POST(request: NextRequest) {
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
        }

        const body = await request.json();
        const { isOpen, reason, reopenDate, action } = body;

        // Action: Lift Review Cooldown manually
        if (action === 'lift_cooldown') {
            const newData = await liftCooldown();
            return NextResponse.json({
                success: true,
                status: newData.is_accepting_commissions ? 'OPEN' : 'CLOSED',
                data: newData
            });
        }

        if (typeof isOpen !== 'boolean') {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // Update Status
        const newData = await setAvailability(isOpen, reason, reopenDate);

        return NextResponse.json({
            success: true,
            status: newData.is_accepting_commissions ? 'OPEN' : 'CLOSED',
            updated: newData.last_updated,
            data: newData
        });

    } catch (error) {
        console.error('Error updating availability:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


