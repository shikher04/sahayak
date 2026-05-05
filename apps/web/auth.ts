/**
 * NextAuth v5 configuration.
 * Providers: Aadhaar OTP (custom), DigiLocker (OAuth2/PKCE), Guest.
 */
import NextAuth, { type NextAuthConfig, type Session, type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    uid_token: string;
    provider: string;
  }
  interface User {
    uid_token: string;
    provider: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid_token: string;
    provider: string;
  }
}

const API_URL = process.env.API_URL ?? "http://localhost:8000";

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    // ── Aadhaar OTP ──────────────────────────────────
    CredentialsProvider({
      id: "aadhaar",
      name: "Aadhaar OTP",
      credentials: {
        aadhaar_number: { label: "Aadhaar Number", type: "text" },
        otp: { label: "OTP", type: "text" },
        txn_id: { label: "Transaction ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.aadhaar_number || !credentials?.otp || !credentials?.txn_id) {
          return null;
        }
        const res = await fetch(`${API_URL}/api/auth/aadhaar/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aadhaar_number: credentials.aadhaar_number,
            otp: credentials.otp,
            txn_id: credentials.txn_id,
          }),
        });
        if (!res.ok) return null;
        const data = await res.json() as { access_token: string };
        // Decode the JWT from FastAPI to extract uid_token
        const [, payloadB64] = data.access_token.split(".");
        const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString()) as {
          uid_token: string;
          name: string;
          provider: string;
        };
        return {
          id: payload.uid_token,
          uid_token: payload.uid_token,
          name: payload.name,
          provider: "aadhaar",
        };
      },
    }),

    // ── Guest (no credentials required) ─────────────
    CredentialsProvider({
      id: "guest",
      name: "Guest",
      credentials: {},
      async authorize() {
        const res = await fetch(`${API_URL}/api/auth/guest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return null;
        const data = await res.json() as { access_token: string };
        const [, payloadB64] = data.access_token.split(".");
        const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString()) as {
          uid_token: string;
        };
        return {
          id: payload.uid_token,
          uid_token: payload.uid_token,
          name: "Guest",
          provider: "guest",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.uid_token = user.uid_token;
        token.provider = user.provider;
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      session.uid_token = token.uid_token;
      session.provider = token.provider;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
