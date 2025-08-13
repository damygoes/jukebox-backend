import {
    RoomId,
    User,
    QueueItem,
    CurrentPlayback,
    TrackId,
} from "../types/events";

interface Room {
    id: RoomId;
    users: Map<string, User>; // socketId → User
    queue: QueueItem[];
    current?: CurrentPlayback | null;
}

export class RoomManager {
    private rooms: Map<RoomId, Room> = new Map();

    joinRoom(roomId: RoomId, socketId: string, user: User) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                id: roomId,
                users: new Map(),
                queue: [],
                current: null,
            });
        }
        const room = this.rooms.get(roomId)!;
        room.users.set(socketId, user);
        return room;
    }

    leaveRoom(roomId: RoomId, socketId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        room.users.delete(socketId);
        if (room.users.size === 0) {
            this.rooms.delete(roomId); // clean up empty room
        }
    }

    addTrack(roomId: RoomId, track: Omit<QueueItem, "votes">) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        const trackWithVotes: QueueItem = { ...track, votes: 0 };
        room.queue.push(trackWithVotes);
        return trackWithVotes;
    }

    voteSkip(roomId: RoomId, trackId: TrackId) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        const track = room.queue.find((t) => t.id === trackId);
        if (track) {
            track.votes += 1;
        }
    }

    startNextTrack(roomId: RoomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.queue.length === 0) return;
        const nextTrack = room.queue.shift()!;
        room.current = {
            trackId: nextTrack.trackId,
            startedAtServerTs: Date.now(),
            positionSec: 0,
        };
        return room.current;
    }

    getRoomState(roomId: RoomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        return {
            roomId: room.id,
            users: Array.from(room.users.values()),
            queue: room.queue,
            current: room.current,
        };
    }
}