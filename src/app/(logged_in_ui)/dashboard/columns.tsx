"use client";

import { ColumnDef } from "@tanstack/react-table";
import { RepoSummary } from "../../types";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const handleBackup = async (repoId: number) => {

    console.log("handle backup : ", repoId);
    const res = await fetch("/api/backup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoId }),
    });
    const data = await res.json();
    console.log(data);
};

export const columns: ColumnDef<RepoSummary>[] = [
    {
        accessorKey: "name",
        header: () => <div className="text-left text-xl">Repository</div>,
        cell: ({ row }) => {
            const repoName: string = row.getValue("name");
            const repoUrl = row.original.url;
            return (
                <Link className="text-right font-medium" href={repoUrl}>
                    {repoName}
                </Link>
            );
        },
    },
    {
        accessorKey: "private",
        header: () => <div className="text-left text-xl">Access</div>,
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const repoId = row.original.id;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild className="cursor-pointer">
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            className="cursor-pointer font-medium"
                            onClick={() => handleBackup(repoId)}
                        >
                            Backup Repo
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
