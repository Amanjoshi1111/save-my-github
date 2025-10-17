"use client";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const router = useRouter();
    return (
        <>
            <div className="h-16 max-w-[1000px] mx-auto flex items-center justify-end px-6">
                <Button onClick={() => signOut(router)} className="cursor-pointer">Log Out</Button>
            </div>
        </>
    );
}
