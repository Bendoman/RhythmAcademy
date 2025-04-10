import Lane from "./Lane";
import Note from "./Note";
import { ZONE_NAMES, HIT_STATUSES } from "./constants";
import { COLORS } from "./constants";

export function drawLine(ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number, strokeStyle: string = 'white', weight: number, dashValues?: number[]) {
    // If no dash values are provided then resets the line dash value to unbroken
    ctx.setLineDash(dashValues || []);
    ctx.lineWidth = weight; 
    
    ctx.beginPath();
    ctx.strokeStyle = strokeStyle;
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
}

export function resetLaneStats(lane: Lane) {
    lane.notesHit = [];
    lane.wrongNotes = [];
    lane.notesMissed = [];

    lane.nextNoteIndex = 0;
}

export function getNoteFill(currentZone: string, hitStatus: string): string {
    let fillStyle = ''; 
    if(currentZone == ZONE_NAMES.EARLY_ZONE)
        fillStyle = COLORS.NOTE_FILL; 
    else if(currentZone == ZONE_NAMES.MISS_ZONE) {
        fillStyle = '#A40606'; 
        if(hitStatus == 'hit')
            fillStyle = '#139A43'; 
    }

    return fillStyle; 
}


// TODO: Come back to this
// export function pixelsToEm(baseFontSize: number, pixels: number): number {
//     if(baseFontSize <= 0) 
//         throw new Error("Invalid base font size provided");

//     return pixels / baseFontSize; 
// }


// TODO Extrapolate Y values from index
export function findSortedIndex(notes: Note[], newNoteIndex: number, lane: Lane): number[] {
    let newNoteY = ((newNoteIndex * (lane.noteGap/lane.innerSubdivision)) - lane.startY) * -1;

    for(let i = 0; i < notes.length; i++) {
        if(i == 0) {
            let y = notes[0].getY(lane.noteGap, lane.innerSubdivision, lane.startY);
            if(y < newNoteY)
                return [0, 0]; 
            if(y == newNoteY)
                return [0, 1]; 
            
            continue; 
        }

        let iMinusOneY = notes[i - 1].getY(lane.noteGap, lane.innerSubdivision, lane.startY);
        let iY = notes[i].getY(lane.noteGap, lane.innerSubdivision, lane.startY);
    
        if(iMinusOneY > newNoteY && iY < newNoteY)
            return [i, 0]; 

        if(iMinusOneY == newNoteY)
            return [i - 1, 1];

        if(iY == newNoteY)
            return [i, 1];
    }

    return [notes.length, 0];
}

export function saveToLocalStorage(key: string, content: string): number {
    try {
        localStorage.setItem(key, content);
        return 0;
    } catch (err) {
        console.error('Failed to save to localStorage:', err);
        return -1; 
    }
}

export function loadFromLocalStorage<T = any>(key: string): T | null {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        return JSON.parse(item) as T;
    } catch (err) {
        console.error(`Failed to load key "${key}" from localStorage:`, err);
        return null;
    }
}

export function listLocalStorageFolder(folder: string) {
    const files: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${folder}/`)) {
            files.push(key.replace(`${folder}/`, ''));
        }
    }

    return files;
}

export const prohibitedKeysList = [
    ' ', 'Backspace', 'Escape', 'Control', 'Enter'
];
