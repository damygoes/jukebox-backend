import {TrackId} from "./track";
import {User} from "./user";

export interface QueueItem {
    id: string; // uuid
    trackId: TrackId
    title: string;
    durationSec: number;
    addedBy: User;
    votes: number;
}