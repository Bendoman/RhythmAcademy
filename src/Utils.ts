import Lane from "./Lane";

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

// TODO: Come back to this
// export function pixelsToEm(baseFontSize: number, pixels: number): number {
//     if(baseFontSize <= 0) 
//         throw new Error("Invalid base font size provided");

//     return pixels / baseFontSize; 
// }