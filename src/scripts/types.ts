// import Lane from "./Lane";
import Note from "./Note";

export type selectedPattern = {
    measures: number; 
    notePositions: number[]; 
}

// TODO: Change this name; 
export type StatsObject = {
    lane: string;
    totalNotes: number; 
    notesHit: Note[]; 
    notesMissed: Note[]; 
    wrongNotes: Note[];
    runTotalTime: number; 
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

export type LoadedLanePreview = {
    sessionName: string; 
    totalNotes: number; 
    numberOfLanes: number; 
    subdivisions: number[]; 
    // difficulty: number; 
}

export type PatternModeSection = { 
    id: string; 
    start: number; 
    occurances: number, 
    length: number, 
    name?: string, 
    data?: any
};

export type DeviationGraphData = {
    interval: string, 
    deviation: number,
    occurances: number
}

export type HitPercentageGraphData = {
    interval: string, 
    hitPercentage: number,
    missPercentage: number,
    hitNotes: number,
    missedNotes: number,
    wrongNotes: number,
}

