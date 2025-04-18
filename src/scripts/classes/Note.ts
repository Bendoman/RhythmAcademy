import { ZONE_NAMES } from "../helpers/constants";

export default class Note {
    // y: number; 
    index: number;
    currentZone: string; 
    hitStatus: string; 
    timeToZone: number; 
    animationHeight: number; 
    timeHit: number; 
    
    constructor(index: number) {
        this.index = index; 
        // Default value before calculations can be made and when scrolling is paused
        this.timeToZone = -1; 

        this.currentZone = ZONE_NAMES.EARLY_ZONE; 
        this.hitStatus = 'unhit';

        this.animationHeight = 0; 

        this.timeHit = 0; 
    }

    public resetNote() { 
        this.currentZone = ZONE_NAMES.EARLY_ZONE; 
        this.hitStatus = 'unhit';
        this.animationHeight = 0; 
    }

    public getY(noteGap: number, innerSubdivision: number, laneStartY: number) {
        return ((this.index * (noteGap/innerSubdivision)) - laneStartY) * -1;
    }

    public startAnimation(type: string) {
        if(type == 'perfect_hit') {
            this.animationHeight = 25; 
        } else if(type == 'hit') {
            this.animationHeight = 20; 
        }
    }
}

