import { COLORS } from "./constants";
import Hitzone from "./Hitzone";
import { ZONE_NAMES, HIT_STATUSES } from "./constants";
import AudioSprite from "./AudioSprite";

export default class Note {
    y: number; 
    currentZone: string; 
    hitStatus: string; 
    timeToZone: number; 

    constructor(y: number) {
        this.y = y; 
        // Default value before calculations can be made and when scrolling is paused
        this.timeToZone = -1; 

        this.currentZone = ZONE_NAMES.EARLY_ZONE; 
        this.hitStatus = 'unhit';
    }

    public resetNote() { 
        this.currentZone = ZONE_NAMES.EARLY_ZONE; 
        this.hitStatus = 'unhit';
    }

    // TODO: Have this implement time calculation logic here.
    public updateTimeToZone(time: number): void { 
        this.timeToZone = time; 
    }

    // TODO: Split this into two functions, one for updating, one for drawing. 
    // Should this be part of the object, or a seperate util function? 
    public updateNote(ctx: CanvasRenderingContext2D, translationAmount: number, x: number, width:number, height:number, hitzone: Hitzone, audioSprite: AudioSprite, nextNote: boolean, ups:number, translationSpeed: number, metronomeEnabled: boolean, hitsound: string): void {       
        let effectiveY = this.y + translationAmount;
        
        let distanceToPerfectHitzone = ((hitzone.perfect_hit_y - translationAmount) - this.y)
        this.timeToZone = ((distanceToPerfectHitzone/translationSpeed)/ups)*1000;
                
        if(effectiveY > hitzone.early_hit_y && this.currentZone == ZONE_NAMES.EARLY_ZONE) 
            this.currentZone = ZONE_NAMES.EARLY_HIT_ZONE;
        else if(effectiveY > hitzone.perfect_hit_y && this.currentZone == ZONE_NAMES.EARLY_HIT_ZONE) {
            this.currentZone = ZONE_NAMES.PERFECT_HIT_ZONE;
            if(audioSprite && metronomeEnabled)
                audioSprite.play(hitsound, 0.25);
        }
        else if(effectiveY > hitzone.late_hit_y && this.currentZone == ZONE_NAMES.PERFECT_HIT_ZONE) 
            this.currentZone = ZONE_NAMES.LATE_HIT_ZONE;
        else if(effectiveY > hitzone.late_hit_y + hitzone.late_hit_height && this.currentZone == ZONE_NAMES.LATE_HIT_ZONE) {
            this.currentZone = ZONE_NAMES.MISS_ZONE;
        }

        if(this.currentZone == ZONE_NAMES.EARLY_ZONE)
            ctx.fillStyle = COLORS.NOTE_FILL; 
        else if(this.currentZone == ZONE_NAMES.EARLY_HIT_ZONE)
            ctx.fillStyle = 'red'; 
        else if(this.currentZone == ZONE_NAMES.PERFECT_HIT_ZONE)
            ctx.fillStyle = 'blue'; 
        else if(this.currentZone == ZONE_NAMES.LATE_HIT_ZONE)
            ctx.fillStyle = 'orange'; 
        else if(this.currentZone == ZONE_NAMES.MISS_ZONE) {
            ctx.fillStyle = 'maroon'; 
            if(this.hitStatus == 'hit')
                ctx.fillStyle = 'gray'; 
        }

        if(nextNote) {
            ctx.fillStyle = 'blue'; 
        }
        // Drop shadow
        // TODO: Put this behind a settings toggle it seriously affects performance
        // ctx.shadowColor = COLORS.NOTE_SHADOW_FILL;
        // ctx.shadowBlur = 8;
        // ctx.shadowOffsetY = 4;
        // ctx.shadowOffsetX = 2;

        ctx.beginPath();
        ctx.roundRect(x, effectiveY - (height/2), width, height, 20);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = "12px sans-serif"
        ctx.fillText(`${this.timeToZone.toFixed(1)}s to zone`, x, this.y + 3 + translationAmount)

        
        // So that future strokes are not affected by the shadow
        // ctx.shadowBlur = 0; 
        // ctx.shadowOffsetY = 0;
        // ctx.shadowOffsetX = 0;
    }

    // When this is implemented it will cycle through an array of animation values
    public animateHit(): void {

    }

    public animateMiss(): void {

    }
}

// {x:laneCanvas.width/2 - laneCanvas.width/4, y:y, width:laneCanvas.width/2, height:lane.note_gap/8, currentZone:'early', hitStatus:'unhit', secondsToPerfectHitzone:null}