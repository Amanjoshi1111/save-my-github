import { getGithubAccessToken } from "@/lib/github";
import { toLowerCase } from "better-auth";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest, res: NextResponse) {
    try {
        console.log("api hitted");
        const token = await getGithubAccessToken();

        const { repoId }: { repoId: string } = await req.json();

        if (!repoId) {
            return NextResponse.json(
                { error: "Missing repoId" },
                { status: 400 }
            );
        }

        console.log(`repoId : ${repoId}, token : ${token}`);

        const response = await axios.post(
            `${process.env.BACKEND_BASE_URL}/backup/${repoId}`,
            {
                token,
            }
        );

        console.log("backup response : ", response.data);

        if (response.status == 200) {
            return NextResponse.json(
                { message: "Backup started successfully!" },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { message: "Backup failed : " + response.data.msg },
            { status: 500 }
        );
    } catch (err) {
        console.error("Error in POST /api/backup", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
