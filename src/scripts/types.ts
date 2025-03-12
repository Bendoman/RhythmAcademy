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