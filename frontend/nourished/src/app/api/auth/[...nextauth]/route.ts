import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/authentication/login', // Redirect to your login page if not authenticated
    },
};

// Handle the NextAuth API request
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
