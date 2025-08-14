import {CurrentPlayback, Track} from "./track";
import {User} from "./user";
import {QueueItem} from "./QueueItem";

export type RoomId = string;

export type Room = {
    id: RoomId;
    users: Map<string, User>; // socketId → User
    queue: QueueItem[];
    current?: CurrentPlayback | null;
}

export type RoomState = {
    roomId: RoomId;
    users: User[];
    queue: QueueItem[];
    current?: CurrentPlayback | null;
};

