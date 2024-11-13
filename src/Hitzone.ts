import { drawLine } from "./Utils";

export default class Hitzone {
    public early_hit_y: number;
    public early_hit_height: number;

    public perfect_hit_y: number;
    public perfect_hit_height: number;

    public late_hit_y: number;
    public late_hit_height: number;

    constructor(
        early_hit_y: number, 
        early_hit_height: number, 
        perfect_hit_y: number, 
        perfect_hit_height: number, 
        late_hit_y: number, 
        late_hit_height: number
    ) {
        this.early_hit_y = early_hit_y;
        this.early_hit_height = early_hit_height;
    
        this.perfect_hit_y = perfect_hit_y;
        this.perfect_hit_height = perfect_hit_height; 
    
        this.late_hit_y = late_hit_y;
        this.late_hit_height = late_hit_height; 
    }

    public drawHitZone(ctx: CanvasRenderingContext2D, width: number) {
    ctx.fillStyle = 'rgba(28, 124, 84, .25)';

    // Perfect hit zone
    drawLine(ctx, 0, this.perfect_hit_y, width, this.perfect_hit_y, 'black');
    ctx.fillRect(0, this.perfect_hit_y, width, this.perfect_hit_height);
    drawLine(ctx, 0, this.perfect_hit_y + this.perfect_hit_height, width, this.perfect_hit_y + this.perfect_hit_height, 'black');

    ctx.fillStyle = 'rgba(28, 124, 84, .1)';
    // Early hit zone
    drawLine(ctx, 0, this.early_hit_y, width, this.early_hit_y, 'black', [5, 5]);
    ctx.fillRect(0, this.early_hit_y, width, this.early_hit_height);    
    // Late hit zone
    ctx.fillRect(0, this.late_hit_y, width, this.late_hit_height);
    drawLine(ctx, 0, this.late_hit_y + this.late_hit_height, width, this.late_hit_y + this.late_hit_height, 'black', [5, 5]);

    }
}