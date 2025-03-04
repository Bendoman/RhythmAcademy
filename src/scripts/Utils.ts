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
    else if(currentZone == ZONE_NAMES.EARLY_HIT_ZONE)
        fillStyle = 'red'; 
    else if(currentZone == ZONE_NAMES.PERFECT_HIT_ZONE)
        fillStyle = 'blue'; 
    else if(currentZone == ZONE_NAMES.LATE_HIT_ZONE)
        fillStyle = 'orange'; 
    else if(currentZone == ZONE_NAMES.MISS_ZONE) {
        fillStyle = 'maroon'; 
        if(hitStatus == 'hit')
            fillStyle = 'gray'; 
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
    let newNoteY = ((newNoteIndex * (lane.noteGap/lane.timeSignature[1])) - lane.startY) * -1;

    for(let i = 0; i < notes.length; i++) {
        if(i == 0) {
            let y = notes[0].getY(lane.noteGap, lane.timeSignature[1], lane.startY);
            if(y < newNoteY)
                return [0, 0]; 
            if(y == newNoteY)
                return [0, 1]; 
            
            continue; 
        }

        let iMinusOneY = notes[i - 1].getY(lane.noteGap, lane.timeSignature[1], lane.startY);
        let iY = notes[i].getY(lane.noteGap, lane.timeSignature[1], lane.startY);
    
        if(iMinusOneY > newNoteY && iY < newNoteY)
            return [i, 0]; 

        if(iMinusOneY == newNoteY)
            return [i - 1, 1];

        if(iY == newNoteY)
            return [i, 1];
    }

    return [notes.length, 0];
}
