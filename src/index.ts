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
} from "./types/events";
import { TTLCache } from "./lib/cache";
import { User } from "./types/user";
import {addTrackSchema, joinRoomSchema, leaveRoomSchema, voteSkipSchema} from "./src/schema";

dotenv.config({ path: ".env.local" });
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
const searchCache = new TTLCache<any[]>(5 * 60 * 1000); // 5 minutes TTL

// ---------- REST: YouTube Search ----------
app.get("/search", async (req, res) => {
    const query = req.query.q?.toString();
    if (!query) return res.status(400).json({ error: "Missing query" });

    // Check cache first
    const cached = searchCache.get(query);
    if (cached) return res.json(cached);

    try {
        const key = process.env.YOUTUBE_API_KEY;
        if (!key) {
            return res.status(500).json({ error: "Missing YouTube API key" });
        }

        const url = new URL("https://www.googleapis.com/youtube/v3/search");
        url.searchParams.set("part", "snippet");
        url.searchParams.set("q", query);
        url.searchParams.set("type", "video");
        url.searchParams.set("maxResults", "10");
        url.searchParams.set("key", key);

        const response = await fetch(url.toString());
        if (!response.ok) {
            return res.status(500).json({ error: "YouTube API error" });
        }
        const data = await response.json();
        const results = data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.default.url,
        }));

        searchCache.set(query, results);
        res.json(results);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ---------- Timers (GLOBAL) ----------
const PLAYBACK_CHECK_INTERVAL = 1000;
const SYNC_INTERVAL = 5000;

// Auto-progress tracks every second
setInterval(() => {
    for (const roomId of rooms.getAllRoomIds()) {
        const newTrack = rooms.startNextTrackIfNeeded(roomId);
        const state = rooms.getRoomState(roomId);
        if (!newTrack || !state) return;

        io.to(roomId).emit("room_state", state);
        io.to(roomId).emit("track_started", { roomId, track: newTrack });
    }
}, PLAYBACK_CHECK_INTERVAL);

// Sync playback position every 5 seconds
setInterval(() => {
    for (const roomId of rooms.getAllRoomIds()) {
        const current = rooms.getCurrentTrack(roomId);
        if (!current) continue;
        const positionSec = (Date.now() - current.startedAtServerTs) / 1000;
        io.to(roomId).emit("playback_synced", { roomId, positionSec });
    }
}, SYNC_INTERVAL);

// ---------- Socket.IO events ----------
io.on("connection", (socket) => {
    log.info({ id: socket.id }, "socket connected");

    socket.on("join_room", (payload) => {
        const parsed = joinRoomSchema.safeParse(payload);
        if (!parsed.success) {
            socket.emit("error", { message: "Invalid join_room payload" });
            return;
        }
        const { roomId, nickname } = parsed.data;
        const user: User = { id: socket.id, nickname };
        const room = rooms.joinRoom(roomId, socket.id, user);
        if (!room) return;
        socket.join(roomId);
        io.to(roomId).emit("room_state", rooms.getRoomState(roomId)!);

        const currentTrack = rooms.getCurrentTrack(roomId);
        if (currentTrack) {
            socket.emit("track_started", { roomId, track: currentTrack });
        }
    });

    socket.on("leave_room", (payload) => {
        const parsed = leaveRoomSchema.safeParse(payload);
        if (!parsed.success) {
            socket.emit("error", { message: "Invalid leave_room payload" });
            return;
        }
        const { roomId } = parsed.data;
        rooms.leaveRoom(roomId, socket.id);
        io.to(roomId).emit(
            "room_state",
            rooms.getRoomState(roomId) ?? { roomId, users: [], queue: [] }
        );
        socket.leave(roomId);
    });

    socket.on("add_track", (payload) => {
        const parsed = addTrackSchema.safeParse(payload);
        if (!parsed.success) {
            socket.emit("error", { message: "Invalid add_track payload" });
            return;
        }
        const { roomId, track } = parsed.data;
        rooms.addTrack(roomId, track);
        io.to(roomId).emit("room_state", rooms.getRoomState(roomId)!);
    });

    socket.on("vote_skip", (payload) => {
        const parsed = voteSkipSchema.safeParse(payload);
        if (!parsed.success) {
            socket.emit("error", { message: "Invalid vote_skip payload" });
            return;
        }
        const { roomId } = parsed.data;
        const current = rooms.getRoomState(roomId)?.current;
        if (current) {
            rooms.voteSkip(roomId, current.trackId);
            io.to(roomId).emit("room_state", rooms.getRoomState(roomId)!);
        }
    });

    socket.on("disconnect", (reason) => {
        log.info({ id: socket.id, reason }, "socket disconnected");
        // Remove the user from all rooms they might be in
        for (const roomId of rooms.getAllRoomIds()) {
            rooms.leaveRoom(roomId, socket.id);
            io.to(roomId).emit(
                "room_state",
                rooms.getRoomState(roomId) ?? { roomId, users: [], queue: [] }
            );
        }
    });
});

const PORT = process.env.PORT ?? 3001;
server.listen(PORT, () => log.info(`listening on ${PORT}`));