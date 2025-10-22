import express from "express";
import type { Express } from "express";
import webhookRouter from "./controllers/webhookRoutes.js";
import repoRouter from "./controllers/repoRoutes.js";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import {
    corsMiddleware,
    customResponse,
    errorHandler,
    me,
    requireAuth,
    validateGithubToken,
} from "./middleware.js";

const app: Express = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3001",
        credentials: true,
    },
});

app.use(corsMiddleware);
app.all("/api/auth/**", toNodeHandler(auth));
app.use(express.json());

app.get("/api/me", requireAuth, me);
app.use("/github/webhook", requireAuth, webhookRouter);
app.use("/", requireAuth, validateGithubToken, repoRouter);

app.use(customResponse);
app.use(errorHandler);

export { server, io };
