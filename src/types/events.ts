// Common types
export type RoomId = string;
export type UserId = string;
export type TrackId = string;

export interface User {
    id: UserId;
    nickname: string;
}

export interface QueueItem {
    id: string; // uuid
    trackId: TrackId;
    title: string;
    durationSec: number;
    addedBy: User;
    votes: number;
}

export interface CurrentPlayback {
    trackId: TrackId;
    startedAtServerTs: number; // server timestamp in ms
    positionSec: number; // last-known position
}

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