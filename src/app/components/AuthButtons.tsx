'use client';
import { signIn, signOut } from "@/lib/auth-client";


export function LoginButton() {
    return (
        <div>
            <div>
                <form action={signIn}>
                    <button type="submit"> Sign In with GitHub </button>
                </form>
            </div>
        </div>
    );
}

export function LogoutButton() {
    return (
        <div>
            <div>
                <form action={signOut}>
                    <button type="submit"> Log out </button>
                </form>
            </div>
        </div>
    );
}

type ButtonProps = {
    onClick: () => void;
    type: "button" | "submit" | "reset",
    text: string
    children: React.ReactNode;
};

