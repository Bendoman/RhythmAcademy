export default class Note {
    x: number; 
    y: number; 
    width: number;
    height: number; 
    currentZone: string; 
    hitStatus: string; 
    timeToZone: number; 

    constructor(
        x: number, 
        y: number, 
        width: number,
        height: number, 
        timeToZone: number
    ) {
        this.x = x;
        this.y = y; 
        this.width = width;
        this.height = height;
        // Default value before calculations can be made and when scrolling is paused
        this.timeToZone = -1; 

        this.currentZone = 'early'; 
        this.hitStatus = 'unhit';
    }

    public updateTimeToZone(time: number): void { this.timeToZone = time; }

    // Should this be part of the object, or a seperate util function? 
    public drawNote(ctx: CanvasRenderingContext2D, translationAmount: number): void {
        ctx.fillRect(this.x, this.y + translationAmount, this.width, this.height);
    }

    // When this is implemented it will cycle through an array of animation values
    public animateHit(): void {

    }

    public animateMiss(): void {

    }
}

// {x:laneCanvas.width/2 - laneCanvas.width/4, y:y, width:laneCanvas.width/2, height:lane.note_gap/8, currentZone:'early', hitStatus:'unhit', secondsToPerfectHitzone:null}