import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import Navbar from "../components/Navbar";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* Navbar */}
            <div className="fixed top-0 left-0 w-full border-b bg-white z-50">
                <Navbar />
            </div>

            {/* Page content below navbar */}
            <main className="pt-16 max-w-[1000px] mx-auto p-4">{children}</main>
        </>
    );
}
