"use client";
import { authClient, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import React from "react";

export function LoginButton() {
    const handleSignIn = async () => {
        console.log("User hit Login");
        await authClient.signIn.social({
            provider: "github",
            callbackURL: "http://localhost:3001/dashboard",
        });
    };
    return (
        <div>
            <div>
                <form onSubmit={handleSignIn}>
                    <button type="submit"> Sign In with GitHub </button>
                </form>
            </div>
        </div>
    );
}

export function LogoutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        console.log("user hit logout");
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/");
                },
            },
        });
    };

    return (
        <div>
            <div>
                <button onClick={handleSignOut}> Log out </button>
            </div>
        </div>
    );
}

type ButtonProps = {
    onClick: () => void;
    type: "button" | "submit" | "reset";
    text: string;
    children: React.ReactNode;
};
