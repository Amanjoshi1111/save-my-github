import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { PrismaClient } from "@/generated/prisma";
import { nextCookies } from "better-auth/next-js";

const prisma = new PrismaClient();
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
            authorization: {
                params: {
                    scope: "read:user user:email repo", // Add scopes you need
                },
            },
        },
    },

    plugins: [nextCookies()],
    // session: {
    //     storeSessionInDatabase: true,
    // },
});

export const signIn = async () => {
    await auth.api.signInSocial({
        body: {
            provider: "github",
            callbackURL: "/dashboard",
        },
    });
};
