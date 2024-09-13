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
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            authorize: async (credentials) => {
                if (!credentials) {
                    return null;
                }

                const { email, password } = credentials;

                const { data: user, error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (loginError || !user) {
                    return null;
                }

                return { id: user.user.id, name: user.user.email };
            }
        })
    ],
    pages: {
        signIn: '/app/login',
        signOut: '/',
    },
    callbacks: {
        async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
            return url.startsWith(baseUrl) ? url : `${baseUrl}/app/`;
        }
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
