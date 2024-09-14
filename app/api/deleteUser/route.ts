// app/api/deleteUser/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/utils/supabaseAdmin';

export async function DELETE(request: Request) {
    const { userId } = await request.json();

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        // First, delete the user from the 'profiles' table
        const { error: profilesError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profilesError) {
            throw new Error(`Error deleting user from profiles: ${profilesError.message}`);
        }

        // Then, delete the user from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            throw new Error(`Error deleting user from auth: ${authError.message}`);
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        // Type check for `Error` instance
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
