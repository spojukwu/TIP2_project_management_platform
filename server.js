const express = require("express");
const connectToDatabase = require("./configuration/DB")
const Users = require("./models/userModel");
const Project = require("./models/project")
const dotenv = require("dotenv").config();
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const sendUserEmail = require("./sendEmail");
const mongoose = require('mongoose');
const { Server } = require("socket.io");
const http = require('http');
const cors = require("cors");
const morgan = require("morgan");
const userRouter = require("./routes/userRoute")
const projectRoute = require("./routes/projectRoute")
const collaborationRoute = require("./routes/collaborationRoute")

// Initialize express app
const projectPlatform = express();
const server = http.createServer(projectPlatform);
const io = new Server(server, {
    cors: {
        origin: "*", // Configure this based on your front-end UR
    }
});

// Middleware
projectPlatform.use(express.json());
projectPlatform.use(cors());
projectPlatform.use(morgan("combined"));

const PORT = process.env.PORT || 9000;

// ConnectTo DATABASE
connectToDatabase();

// Route middleware
projectPlatform.use("/api", userRouter);
projectPlatform.use("/api", projectRoute)
projectPlatform.use("/api", collaborationRoute)

// Socket.io setup 
io.on("connection", (socket) => {
    console.log("a user connected:", socket.id);

    socket.on("joinProject", (projectId) => {
        socket.join(projectId);
        console.log(`User joined project: ${projectId}`);
    });

    socket.on("message", (data) => {
        io.to(data.projectId).emit("message", data);
    });

    socket.on("disconnect", () => {
        console.log("user disconnect");
    });
});

projectPlatform.use((req, res) => {
    return res.status(404).json({ message: "This endpoint does not exist yet" });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});