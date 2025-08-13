import express from "express";
import http from "http";
import cors from "cors";
import pino from "pino";
import dotenv from "dotenv";
import { Server as IOServer } from "socket.io";
import { RoomManager } from "./lib/rooms";
import {
    ClientToServerEvents,
    ServerToClientEvents,
    User,
} from "./types/events";

dotenv.config();
const log = pino();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);

// Pass types to Socket.IO
const io = new IOServer<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: { origin: "*" },
});

const rooms = new RoomManager();

io.on("connection", (socket) => {
    log.info({ id: socket.id }, "socket connected");

    socket.on("join_room", ({ roomId, nickname }) => {
        const user: User = { id: socket.id, nickname };
        const room = rooms.joinRoom(roomId, socket.id, user);
        io.to(roomId).emit("room_state", rooms.getRoomState(roomId)!);
        socket.join(roomId);
    });

    socket.on("leave_room", ({ roomId }) => {
        rooms.leaveRoom(roomId, socket.id);
        io.to(roomId).emit("room_state", rooms.getRoomState(roomId) ?? { roomId, users: [], queue: [] });
        socket.leave(roomId);
    });

    socket.on("add_track", ({ roomId, track }) => {
        rooms.addTrack(roomId, track);
        io.to(roomId).emit("room_state", rooms.getRoomState(roomId)!);
    });

    socket.on("vote_skip", ({ roomId }) => {
        const current = rooms.getRoomState(roomId)?.current;
        if (current) {
            rooms.voteSkip(roomId, current.trackId);
            io.to(roomId).emit("room_state", rooms.getRoomState(roomId)!);
        }
    });

    socket.on("disconnect", (reason) => {
        log.info({ id: socket.id, reason }, "socket disconnected");
        // Clean up user from all rooms they were in
        rooms.leaveRoom(socket.id as any, socket.id);
    });
});

const PORT = process.env.PORT ?? 3001;
server.listen(PORT, () => log.info(`listening on ${PORT}`));