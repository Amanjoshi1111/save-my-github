import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
            authorization: {
                params: {
                    scope: "read:user user:email repo ",
                },
            },
        },
    },
    trustedOrigins: ["http://localhost:3001", "http://localhost:3000"],
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        },
    },
    // Important for backend testing
    advanced: {
        cookieOptions: {
            sameSite: "lax", // Changed from "none"
            httpOnly: true,
        },
        useSecureCookies: false, // Set to true in production with HTTPS
    },
});

export type SessionType = typeof auth.$Infer.Session.session;
export type UserType = typeof auth.$Infer.Session.user;