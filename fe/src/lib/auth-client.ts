import { createAuthClient } from "better-auth/client";
import { useRouter } from "next/navigation";
const authClient = createAuthClient();

export const signIn = async () => {
    const data = await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
    });
};

export const signOut = async (router: ReturnType<typeof useRouter>) => {
    await authClient.signOut({
        fetchOptions: {
            onSuccess: () => {
                router.push("/login");
            },
        },
    });
};
