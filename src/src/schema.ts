import { z } from "zod";

// User type
export const userSchema = z.object({
    id: z.string().min(1),
    nickname: z.string().min(1),
});

// Track type
export const trackSchema = z.object({
    id: z.string().min(1),
    trackId: z.string().min(1),
    title: z.string().min(1),
    durationSec: z.number().positive(),
    addedBy: userSchema,
    votes: z.number().min(0).optional(),
    startedAtServerTs: z.number().optional(),
});

// Socket event payloads
export const joinRoomSchema = z.object({
    roomId: z.string().min(1),
    nickname: z.string().min(1),
});

export const leaveRoomSchema = z.object({
    roomId: z.string().min(1),
});

export const addTrackSchema = z.object({
    roomId: z.string().min(1),
    track: trackSchema,
});

export const voteSkipSchema = z.object({
    roomId: z.string().min(1),
});