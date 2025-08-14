import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

socket.on("connect", () => {
    console.log("connected with id:", socket.id);

    // Join a room
    socket.emit("join_room", { roomId: "room1", nickname: "Alice" });

    setTimeout(() => {
        socket.emit("add_track", {
            roomId: "room1",
            track: {
                id: "t1",
                trackId: "abc123",
                title: "Song 1",
                durationSec: 10, // short for testing
                addedBy: { id: socket.id, nickname: "Alice" },
            },
        });
    }, 500);
});

// Listen for room_state and track_started
socket.on("room_state", (state) => {
    console.log("room_state:", state);
});

socket.on("track_started", (data) => {
    console.log("track_started:", data);
});

socket.on("playback_synced", (data) => {
    console.log("playback_synced:", data);
});