import {User} from "./user";
import {CurrentPlayback, TrackId} from "./track";
import {RoomId} from "./room";
import {QueueItem} from "./QueueItem";

// ======================
// Client → Server Events
// ======================
export interface ClientToServerEvents {
    join_room: (payload: { roomId: RoomId; nickname: string }) => void;
    leave_room: (payload: { roomId: RoomId }) => void;
    add_track: (payload: { roomId: RoomId; track: Omit<QueueItem, "votes"> }) => void;
    vote_skip: (payload: { roomId: RoomId }) => void;
    playback_seek: (payload: { roomId: RoomId; positionSec: number }) => void;
}

// ======================
// Server → Client Events
// ======================
export interface ServerToClientEvents {
    room_state: (state: {
        roomId: RoomId;
        users: User[];
        queue: QueueItem[];
        current?: CurrentPlayback | null;
    }) => void;

    track_started: (payload: { roomId: RoomId; track: CurrentPlayback }) => void;
    track_skipped: (payload: { roomId: RoomId; trackId: TrackId }) => void;
    playback_synced: (payload: { roomId: RoomId; positionSec: number }) => void;
}