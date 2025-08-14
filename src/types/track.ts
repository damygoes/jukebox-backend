export type TrackId = string;

export type Track = {
    id: string; // unique per track in queue
    trackId: TrackId; // e.g., YouTube videoId
    title: string;
    durationSec: number;
    addedBy: { id: string; nickname: string };
};

export interface CurrentPlayback {
    trackId: TrackId;
    startedAtServerTs: number; // server timestamp in ms
    positionSec: number; // last-known position
    durationSec: number;
    title?: string; // optional track title
}