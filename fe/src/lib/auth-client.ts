import { createAuthClient } from "better-auth/client";
import { useRouter } from "next/navigation";
export const authClient = createAuthClient({
    baseURL: process.env.BACKEND_BASE_URL || "http://localhost:3000",
    fetchOptions:{
        credentials: "include"
    }
});


export const signOut = async () => {
    await authClient.signOut({
        fetchOptions: {
            onSuccess: () => {
                // router.push("/login");
            },
        },
    });
};
