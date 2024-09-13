import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Login", type: "text" },
                password: { label: "Password", type: "password" }
            },
            authorize: async (credentials) => {
                if (!credentials) {
                    console.error('No credentials provided');
                    return null;
                }

                const { username, password } = credentials;

                const { data: user, error: loginError } = await supabase.auth.signInWithPassword({
                    email: username,
                    password: password,
                });

                if (loginError || !user) {
                    console.error('Error logging in:', loginError?.message || 'No user found');
                    return null;
                }

                return { id: user.user.id, name: user.user.email };
            }
        })
    ],
    pages: {
        signIn: '/app/admin/login',
        signOut: '/',
    },
    callbacks: {
        async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
            return url.startsWith(baseUrl) ? url : `${baseUrl}/app/admin/dashboard`;
        }
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
