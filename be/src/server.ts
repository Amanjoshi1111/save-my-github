import express from "express";
import cors from "cors";
import type { Request, Response, Express, NextFunction } from "express";
import CustomException from "./errorHandling/CustomException.js";
import { Prisma } from "@prisma/client";
import webhookRouter from "./controllers/webhookRoutes.js";
import repoRouter from "./controllers/repoRoutes.js";
import { validateGithubToken } from "./lib/helper.js";

const app: Express = express();

app.use(cors());
app.use(express.json());

app.use("/webhook", webhookRouter);
app.use("/",validateGithubToken, repoRouter);

// Global response formatter
app.use((req: Request, res: Response, next: NextFunction) => {
    const oldJson = res.json;
    res.json = function (data: any) {
        const formatted = {
            code: "BE000",
            status: res.statusCode,
            data,
        };
        return oldJson.call(this, formatted);
    };
    next();
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.log("Error : ", err);

    if (err instanceof CustomException) {
        return res.status(err.status).json({
            code: err.code,
            message: err.message,
        });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // unique constraint violation, foreign key violation
        return res.status(400).json({
            code: "BE400",
            message: err.message,
        });
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        // Invalid query shape or missing required fields
        return res.status(400).json({
            code: "BE400",
            message: err.message,
        });
    }

    if (
        err instanceof Prisma.PrismaClientUnknownRequestError ||
        err instanceof Prisma.PrismaClientRustPanicError ||
        err instanceof Prisma.PrismaClientInitializationError
    ) {
        // Unexpected server or Prisma internal errors
        return res.status(500).json({
            code: "BE099",
            message: "INTERNAL SERVER ERROR",
        });
    }

    return res.status(500).json({
        code: "BE099",
        message: "INTERNAL SERVER ERROR",
    });
});

export default app;
