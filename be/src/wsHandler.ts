import { io } from "./server.js";

const chatNamespace = io.of("/chat");

chatNamespace.on("connection", (socket) => {
    console.log("✅ Chat client connected:", socket.id);

    // Send welcome message
    // socket.emit("message", {
    //     type: "system",
    //     text: "Welcome to chat!",
    // });

    socket.send("message", {
        message: "hello"
    })

    // Listen for chat messages
    socket.on("send-message", (data) => {
        console.log("Chat message received:", data);

        // Broadcast to all clients in chat namespace
        chatNamespace.emit("message", {
            type: "user",
            text: data.message,
            sender: socket.id,
            timestamp: new Date(),
        });
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
        socket.broadcast.emit("user-typing", {
            userId: socket.id,
            isTyping: data.isTyping,
        });
    });

    socket.on("disconnect", () => {
        console.log("❌ Chat client disconnected:", socket.id);
    });
});
