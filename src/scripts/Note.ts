import { ZONE_NAMES } from "./constants";

export default class Note {
    // y: number; 
    index: number;
    currentZone: string; 
    hitStatus: string; 
    timeToZone: number; 
    animationHeight: number; 
    animationColour: string; 

    constructor(index: number) {
        this.index = index; 
        // Default value before calculations can be made and when scrolling is paused
        this.timeToZone = -1; 

        this.currentZone = ZONE_NAMES.EARLY_ZONE; 
        this.hitStatus = 'unhit';

        this.animationHeight = 0; 
        this.animationColour = '';
    }

    public resetNote() { 
        this.currentZone = ZONE_NAMES.EARLY_ZONE; 
        this.hitStatus = 'unhit';
    }

    public getY(noteGap: number, timeSignature: number, laneStartY: number) {
        return ((this.index * (noteGap/timeSignature)) - laneStartY) * -1;
    }

    public startAnimation(type: string) {
        if(type == 'perfect_hit') {
            this.animationHeight = 25; 
        } else if(type == 'hit') {
            this.animationHeight = 20; 
        }
    }

    public deprecateAnimation(type: string) {

    }
}
