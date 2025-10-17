import express from "express";
import cors from "cors";
import octokit from "./octokitConfig.js";
import type { Request, Response, Express } from "express";
import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";
import {prisma} from "./prisma.js";

const app: Express = express();

app.use(cors());
app.use(express.json());

type RepoSummary = {
    id: number;
    name: string;
    fullName: string;
    private: boolean;
    url: string;
};

app.get("/", async (req: Request, res: Response) => {
    const response = await octokit.request("GET /user");
    res.json(response.data);
});

app.get("/repos", async (req: Request, res: Response) => {
    const pageNo = Number(req.query.pageNo) | 1;
    const pageSize = Number(req.query.pageSize) | 10;

    const response = await octokit.repos.listForAuthenticatedUser({
        per_page: pageSize,
        page: pageNo,
    });

    const responseData: RepoSummary[] = response.data.map((data) => {
        return {
            id: data.id,
            name: data.name,
            fullName: data.full_name,
            private: data.private,
            url: data.html_url,
        };
    });
    res.json(responseData);
});

app.get("/download/:repoId", async (req: Request, res: Response) => {
    const { repoId } = req.params;

    try {
        // Octokit SDK request by repository ID
        const { data: repo } = await octokit.request(
            "GET /repositories/{repository_id}",
            { repository_id: Number(repoId) }
        );

        const owner: string = repo.owner.login;
        const repoName: string = repo.name;

        const archive = await octokit.rest.repos.downloadZipballArchive({
            owner: owner,
            repo: repoName,
            ref: "",
        });

        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${repoName}.zip`
        );

        res.send(Buffer.from(archive.data as ArrayBuffer));
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

app.post("/backup/:repoId", async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        const { repoId } = req.params;

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        console.log("Required Details : ", { token, repoId, __dirname });

        const workerPath = path.resolve(__dirname, "../script.js");
        console.log("worketPath : ", workerPath);
        const worker = new Worker(workerPath, {
            workerData: { repoId, auth: token },
        });

        worker.once("message", async (response) => {
            console.log("RESPONSE : ", response);
            const success = response.success;
            if (success) {
                await prisma.backup.create({
                    data: {
                        owner: response.owner,
                        repoId: Number(repoId),
                        repoName: response.repoName,
                        lastBackupDate: new Date(),
                    },
                });
                return res.status(200).json({ msg: response.msg });
            }
            console.log("error msg : ", response.error.message);
            return res.status(500).json({ msg: response.error.message });
        });
 
        worker.once("error", (err) => {
            return res.status(500).json({ msg: err.message });
        });
    } catch (err: any) {
        return res.status(500).json({ msg: err.message });
    }
});

export default app;
