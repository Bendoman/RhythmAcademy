import Lane from "./Lane";
import Note from "./Note";

export type selectedPattern = {
    measures: number; 
    notePositions: number[]; 
}

export type StatsObject = {
    lane: string;
    totalNotes: number; 
    notesHit: Note[]; 
    notesMissed: Note[]; 
}

export type FriendRequest = {
    id: string, 
    status: string, 
    created_at: string, 
    sender_id: string, 
    sender: {
        email: any
    }
}