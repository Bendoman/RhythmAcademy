import { ZONE_NAMES } from "./constants";

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
}
