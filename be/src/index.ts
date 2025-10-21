import { server } from "./server.js";
import "./wsHandler.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.HTTP_PORT || 3001;

server.listen(PORT, () => {
    console.log("Server is running on PORT: ", PORT);
});
