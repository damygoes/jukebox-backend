import {Room, RoomId, RoomState} from "../types/room";
import { User } from "../types/user";
import { QueueItem } from "../types/QueueItem";
import {CurrentPlayback, TrackId} from "../types/track";

export class RoomManager {
    private rooms: Map<RoomId, Room> = new Map();

    joinRoom(roomId: RoomId, socketId: string, user: User): Room {
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

    leaveRoom(roomId: RoomId, socketId: string): void {
        const room = this.rooms.get(roomId);
        if (!room) return;
        room.users.delete(socketId);
        if (room.users.size === 0) {
            this.rooms.delete(roomId); // clean up empty room
        }
    }

    addTrack(roomId: RoomId, track: Omit<QueueItem, "votes">): QueueItem | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        const trackWithVotes: QueueItem = { ...track, votes: 0 };
        room.queue.push(trackWithVotes);

        // 🆕 If nothing is playing, start immediately
        if (!room.current) {
            this.startNextTrack(roomId);
        }

        return trackWithVotes;
    }

    voteSkip(roomId: RoomId, trackId: TrackId): void {
        const room = this.rooms.get(roomId);
        if (!room) return;
        const track = room.queue.find((t) => t.id === trackId);
        if (track) {
            track.votes += 1;
        }
    }

    startNextTrack(roomId: RoomId): CurrentPlayback | null {
        const room = this.rooms.get(roomId);
        if (!room || room.queue.length === 0) {
            room!.current = null;
            return null;
        }
        const nextTrack = room.queue.shift()!;
        room.current = {
            trackId: nextTrack.trackId,
            startedAtServerTs: Date.now(),
            positionSec: 0,
            durationSec: nextTrack.durationSec, // 🆕 include duration
            title: nextTrack.title, // optional: send title for frontend display
        };
        return room.current;
    }

    getRoomState(roomId: RoomId): RoomState | null {
        const room = this.rooms.get(roomId);
        if (!room) {
            throw new Error(`Room ${roomId} not found`);
        }
        return {
            roomId: room.id,
            users: Array.from(room.users.values()),
            queue: room.queue,
            current: room.current
        };
    }

    getCurrentTrack(roomId: RoomId): CurrentPlayback | null {
        const room = this.rooms.get(roomId);
        return room?.current ?? null;
    }

    // Automatically start next track if current is null or ended
    startNextTrackIfNeeded(roomId: RoomId): CurrentPlayback | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        if (!room.current) {
            return this.startNextTrack(roomId);
        }

        // Check if track duration has passed
        if (
            room.current.durationSec &&
            Date.now() - room.current.startedAtServerTs >=
            room.current.durationSec * 1000
        ) {
            return this.startNextTrack(roomId);
        }

        return room.current;
    }

    getAllRoomIds(): RoomId[] {
        return Array.from(this.rooms.keys());
    }
}