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

                if (loginError || !user || !user.user) {
                    return null;
                }

                // Return all necessary user info, including email and id
                return {
                    id: user.user.id,
                    email: user.user.email,
                };
            }
        })
    ],
    pages: {
        signIn: '/app/login',
        signOut: '/',
    },
    callbacks: {
        async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
            return url.startsWith(baseUrl) ? url : `${baseUrl}/`;
        },
        async session({ session, token }) {
            if (token) {
                session.user = session.user || {};
                session.user.email = token.email as string;
                session.user.id = token.id as string;
            }
            return session;
        },

        async jwt({ token, user }) {
            if (user) {
                token.email = user.email;
                token.id = user.id;
            } else if (token.sub) {
                token.id = token.sub;
            }
            return token;
        }
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
