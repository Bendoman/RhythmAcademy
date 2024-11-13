export function drawLine(ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number, strokeStyle: string = 'white', dashValues?: number[]) {
    if(dashValues)
        ctx.setLineDash(dashValues);
    
    ctx.beginPath();
    ctx.strokeStyle = strokeStyle;
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
}