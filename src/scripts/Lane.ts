import Note from "./Note.ts";
import Hitzone from "./Hitzone.ts";
import { drawLine, getNoteFill } from "./Utils";
import { COLORS, EDIT_MODES, HIT_STATUSES, ZONE_NAMES } from "./constants";
import AudioSprite from "./AudioSprite.ts";
import { selectedPattern } from "./types.ts";

// TODO: Make sure that values relient on height can be updated when the window size changes. Have an update function for this. 
export default class Lane {
    public bpm: number;
    public measureCount: number; 
    public maxMeasureCount: number;
    public timeSignature: number[]; // Index 0 will be the upper numeral, index 1 the lower
    public metronomeEnabled: boolean; 

    // Defines the distance between full* notes
    public noteGap: number; 
    public nextNoteIndex: number; 
    
    public hitzone: Hitzone; 
    public hitsound: string; 
    public metronomeSound: string; 
    
    // The height above the hitzone that notes will be populated upon run start
    public startY: number; 
    public height: number; 
    // TODO: come back to this
    public loopedHeight: number; 
    
    public notes: Note[];
    public looped: boolean;
    public loopedNotes: number;
    public nonLoopedNotes: any;

    public notesHit: Note[] = [];
    public notesMissed: Note[] = [];
    public wrongNotes: Note[] = []; 

    public maxWrongNotes: number; 

    // TODO: Remove 
    // public canvasWidth: number; 
    // public canvasHeight: number; 

    public topOfLane: number; 
    public topOfInputVisual: number;

    public inputKey: string; 
    public inputAreaHeight: number;
    public pressed: boolean;
    
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    public translationAmount: number; 

    public audioSprite: any;
    public metronomeSprite: any;

    public hitPrecision: number; 
    public patternStartMeasure: number; 

    public fullyScrolled: boolean;

    constructor(
        bpm: number, 
        measureCount: number, 
        maxMeasureCount: number,
        noteGap: number,
        hitsound: string, 
        maxWrongNotes: number,
        notes: Note[],
        timeSignature: number[],
        inputKey: string,
        canvas: HTMLCanvasElement,
        hitPrecision: number
    ) {
        this.bpm = bpm; 
        this.measureCount = measureCount;
        this.maxMeasureCount = maxMeasureCount;
        this.timeSignature = timeSignature;

        this.notes = notes; 
        this.loopedNotes = 0;

        // Note gap defines the distance between between note values that the time signature is counting
        this.noteGap = noteGap;
        
        this.hitsound = hitsound; 
        this.looped = false; 
        this.maxWrongNotes = maxWrongNotes;
        
        this.canvas = canvas; 
        this.ctx = this.canvas.getContext('2d')!; 

        // this.canvasWidth = this.canvas.width;
        // this.canvas.height = this.canvas.height;
        
        this.hitPrecision = hitPrecision;
        this.hitzone = this.calculateHitzone(); 

        // So that the first note drawn will be exaclty one full note above the perfect hit area
        this.startY = this.calculatePerfectHitY() - this.noteGap;
        
        // timeSignature[0] represents the upper numeral (the number of notes per bar)
        // this.height = measureCount * (this.timeSignature[0] * this.noteGap); 
        // this.topOfLane = this.startY - this.height; 
        
        this.height = this.calculateHeight(false);
        this.loopedHeight = this.calculateHeight(true);

        // this.effectiveHeight = this.calculateHeight(true); 
        this.topOfLane = this.calculateTopOfLane(false); 

        this.topOfInputVisual = this.canvas.height - 70;
        this.nextNoteIndex = 0; 

        this.inputKey = inputKey;
        this.inputAreaHeight = this.canvas.height - this.topOfInputVisual;

        this.translationAmount = 0; 
        this.pressed = false;
        this.metronomeEnabled = false;

        this.metronomeSound = 'metronome1';
        this.patternStartMeasure = 0; 

        this.fullyScrolled = false; 
    }

    public setNotes(notes: Note[]): void { this.notes = notes; }

    public incrementNoteIndex() { this.nextNoteIndex++; }

    public recalculateHeight() {
        this.height = this.measureCount * (this.timeSignature[0] * this.noteGap); 
        this.topOfLane = this.startY - this.height;
    }

    // TODO: Give this better name and have one that also removes all notes 
    public resetLane() { 
        this.fullyScrolled = false;
        this.translationAmount = 0; 
        this.notesHit = [];
        this.notesMissed = [];

        for(let i = 0; i < this.notes.length; i++) {
            let note = this.notes[i];
            note.resetNote();
        }
        this.nextNoteIndex = 0; 
    }

    // TODO: Update note colours based on hitzone at time of hit
    public handleInputOn(paused: boolean) { 
        this.pressed = true; 
        // Sets pressed so that input modes can be tested, but returns after so that notes can't be hit
        if(paused)
            return; 

        let nextNote;
        nextNote = this.notes[this.nextNoteIndex];

        let noteCopy = new Note(nextNote.index);
        noteCopy.currentZone = nextNote.currentZone;
        noteCopy.hitStatus = nextNote.hitStatus;
        noteCopy.timeToZone = nextNote.timeToZone; 

        switch(nextNote.currentZone) {
            case ZONE_NAMES.EARLY_ZONE:
                console.log(`Wrong note:\nTime to zone: ${nextNote.timeToZone}\nZone: ${nextNote.currentZone}`);
                break;
            case ZONE_NAMES.EARLY_HIT_ZONE:
                console.log(`Early hit:\nTime to zone: ${nextNote.timeToZone}\nZone: ${nextNote.currentZone}`);
                if(this.audioSprite)
                    this.audioSprite.play(this.hitsound);
                nextNote.hitStatus = 'hit';
                noteCopy.hitStatus = 'hit';
                this.notesHit.push(noteCopy);
                this.nextNoteIndex++;
                break;
            case ZONE_NAMES.PERFECT_HIT_ZONE:
                console.log(`Perfect hit:\nTime to zone: ${nextNote.timeToZone}\nZone: ${nextNote.currentZone}`);
                if(this.audioSprite)
                    this.audioSprite.play(this.hitsound);
                nextNote.hitStatus = 'hit';
                noteCopy.hitStatus = 'hit';
                this.notesHit.push(noteCopy);
                this.nextNoteIndex++;
                break;
            case ZONE_NAMES.LATE_HIT_ZONE:
                console.log(`Late hit:\nTime to zone: ${nextNote.timeToZone}\nZone: ${nextNote.currentZone}`);
                if(this.audioSprite)
                    this.audioSprite.play(this.hitsound);
                nextNote.hitStatus = 'hit';
                noteCopy.hitStatus = 'hit';
                this.notesHit.push(noteCopy);
                this.nextNoteIndex++;
                break;
        }
    }

    public handleInputOff() { 
        this.pressed = false; 
    }

    public drawInputVisual() {
        this.ctx.fillStyle = this.pressed ? COLORS.PRESSED_INPUT_FILL : COLORS.UNPRESSED_INPUT_FILL;
        drawLine(this.ctx, 0, this.topOfInputVisual, this.canvas.width, this.topOfInputVisual, 'black', 2);
        this.ctx.fillRect(0, this.topOfInputVisual, this.canvas.width, this.inputAreaHeight);

        this.ctx.fillStyle = this.pressed ? COLORS.INPUT_KEY_PRESSED : COLORS.INPUT_KEY_UNPRESSED;
        this.ctx.font = "italic 50px Inria-serif"
        this.ctx.fillText(this.inputKey.toUpperCase(), this.canvas.width/2 - 20, this.topOfInputVisual + 50); 
    }

        
    // let inverse = ((newNoteIndex * (lane.noteGap/lane.timeSignature[1])) - lane.startY) * -1;

    // Draws all notes and looped notes to the screen
    public updateAndDrawNotes(editMode: boolean, ups: number, translationSpeed: number, noteOverride?: Note[]) {
        let notesArray;
        if(noteOverride)
            notesArray = noteOverride; 
        else 
            notesArray = this.notes; 
        
        for(let i = 0; i < notesArray.length; i++) {
            let note;
            if(noteOverride)
                note = noteOverride[i]; 
            else
                note = this.notes[i]; 
            
            // TODO: Change for new note object
            let effectiveY = note.getY(this.noteGap, this.timeSignature[1], this.startY) + this.translationAmount;
            // Reduces time spent drawing notes that have scrolled passed the bottom of the screen
            if(effectiveY > this.canvas.height)
                continue;
            // Does not loop through any notes that won't be dispalyed on the screen
            // -noteGap instead of 0 as notes are on a slight y offset and would pop in
            if(effectiveY < -this.noteGap) 
                return;
            
            if(!editMode) 
                this.updateNote(note, effectiveY, ups, translationSpeed);


            this.drawNote(note, effectiveY);
        }
    }

    public drawNote(note: Note, y: number) {
        let x = (this.canvas.width/2) - (this.canvas.width/4);
        let width = this.canvas.width/2;

        // TODO: Review this, justify it.
        let height = this.noteGap/(this.timeSignature[1] * this.timeSignature[0])
        if(height < 5) // TODO: Alter this min height
            height = 5; 

        this.ctx.fillStyle = getNoteFill(note.currentZone, note.hitStatus); 
        if(this.notes.indexOf(note) == this.nextNoteIndex)
            this.ctx.fillStyle = 'blue';
        
        this.ctx.beginPath();
        this.ctx.roundRect(x, y - (height/2), width, height, 20);
        this.ctx.fill();

        // this.ctx.fillStyle = 'white';
        // this.ctx.font = "12px sans-serif"
        // this.ctx.fillText(`${note.timeToZone.toFixed(1)}ms to zone`, x, y + 3)
    }

    // Updates the hitzone and hitstatus of a specific note
    public updateNote(note: Note, y: number, ups: number, translationSpeed: number) {

        // TODO: Change for new note object
        let distanceToPerfectHitzone = ((this.hitzone.perfect_hit_y - this.translationAmount) - note.getY(this.noteGap, this.timeSignature[1], this.startY))

        // TODO: this is disgustingly ugly


        if(note.hitStatus == 'unhit')
            note.timeToZone = ((distanceToPerfectHitzone/translationSpeed)/ups)*1000;

        if(y > this.hitzone.early_hit_y && note.currentZone == ZONE_NAMES.EARLY_ZONE) 
            note.currentZone = ZONE_NAMES.EARLY_HIT_ZONE;
        else if(y > this.hitzone.perfect_hit_y && note.currentZone == ZONE_NAMES.EARLY_HIT_ZONE) {
            note.currentZone = ZONE_NAMES.PERFECT_HIT_ZONE;
            if(this.audioSprite && this.metronomeEnabled)
                this.audioSprite.play(this.hitsound, 0.25);
        }
        else if(y > this.hitzone.late_hit_y && note.currentZone == ZONE_NAMES.PERFECT_HIT_ZONE) 
            note.currentZone = ZONE_NAMES.LATE_HIT_ZONE;
        else if(y > this.hitzone.late_hit_y + this.hitzone.late_hit_height && note.currentZone == ZONE_NAMES.LATE_HIT_ZONE) {
            note.currentZone = ZONE_NAMES.MISS_ZONE;
            if(this.notes.indexOf(note) == this.nextNoteIndex) {
                note.hitStatus = 'missed';
                this.nextNoteIndex++;
                let noteCopy = new Note(note.index);
                noteCopy.currentZone = note.currentZone;
                noteCopy.hitStatus = note.hitStatus;
                this.notesMissed.push(noteCopy); 
            }
        }
    }


    public drawHitzone() {
        this.hitzone.drawHitZone(this.ctx, this.canvas.width);
    }
    
    public drawMeasureIndicators(editMode?: string, newPatternMeasures?: number) {
        let noteCount = 1; 
        let topOfLane;
        if(this.looped)
            topOfLane = this.calculateTopOfLane(true);
        else 
            topOfLane = this.calculateTopOfLane(false);
    
         if(newPatternMeasures && editMode && editMode == EDIT_MODES.CREATE_PATTERN_MODE)
            topOfLane = this.calcualteTopOfMeasuresN(newPatternMeasures)

            
        for(let y = this.startY; y > topOfLane; y -= this.noteGap) {
            // Optimisation so that only the measure lines actually visible on the page need to be drawn
            if(y + this.translationAmount > this.canvas.height) {
                noteCount++;
                // Resets the note count back to 1 after reaching the maximum defined by the time signature
                if(noteCount > this.timeSignature[0]) 
                    noteCount = 1;
                continue; 
            }
            
            if(y + this.translationAmount < 0)
                return; 
            // TODO: Add a continue statement here so that measure lines before the currently visible section aren't drawn either. Potentially use an index range?

            // this.ctx.strokeStyle = COLORS.MEASURE_LINE_FILL;
            // So that the actual y values can be held constant
            let effectiveY = y + this.translationAmount;
            // TODO: Choose more generic starting X value
            drawLine(this.ctx, 30, effectiveY, this.canvas.width - 30, effectiveY,COLORS.MEASURE_LINE, 1);

            // Emphasises the first note of a bar by giving it bigger text
            // TODO: Create a functional pixel to em converted and use relative units to position these.
            this.ctx.fillStyle = COLORS.MEASURE_NUMBER;
            if(noteCount == 1) {
                this.ctx.font = "italic 36px Inria-serif"
                this.ctx.fillText(noteCount.toString(), 6, y + 10 + this.translationAmount)
            } else {
                this.ctx.font = "italic 20px Inria-serif"
                this.ctx.fillText(noteCount.toString(), 10, y + 5 + this.translationAmount)
            }

            noteCount++;
            // Resets the note count back to 1 after reaching the maximum defined by the time signature
            if(noteCount > this.timeSignature[0]) 
                noteCount = 1;
        }
    }

    private calculatePerfectHitY() {
        return this.canvas.height - (this.canvas.height * 0.25); 
    }

    public calculateHitzone(): Hitzone {
        // TODO: Decide if this level of dynamic sizing is even necessary.
        let nonPerfectHitArea = (this.noteGap / ((this.hitPrecision*2)/this.timeSignature[1]))/2; //TODO: Write justifcation for this
        let perfectHitArea = (this.noteGap / (32/this.timeSignature[1]))/2;

        // let early_hit_y = this.canvas.height - (this.canvas.height * 0.25); 
        let perfect_hit_y = this.calculatePerfectHitY();

        // let perfect_hit_y = early_hit_y + nonPerfectHitArea; 
        let early_hit_y = perfect_hit_y - nonPerfectHitArea

        let late_hit_y = perfect_hit_y + perfectHitArea; 


        return new Hitzone(early_hit_y, nonPerfectHitArea, perfect_hit_y, perfectHitArea, late_hit_y, nonPerfectHitArea); 
    }

    public loopNotes(loops: number) {
        let length = this.notes.length; 
        this.loopedNotes = 0; 
        for(let l = 1; l < loops; l++) {
            for(let i = 0; i < length; i++) {
                
                
                let newNoteY = this.notes[i].getY(this.noteGap, this.timeSignature[1], this.startY) - (this.height * l)
                let newNoteIndex = (this.startY - newNoteY) / (this.noteGap/this.timeSignature[1]);


                let newNote = new Note(newNoteIndex);
                // TODO: Calculate y, then calculate index based on it. 
                // newNoteIndex = (lane.startY - newNoteY) / (lane.noteGap/lane.timeSignature[1]);



                this.notes.push(newNote); // Change this to looped notes 
                this.loopedNotes++; 
                console.log('pushing new note');
                // this.notes.push(new Note(this.notes[i].y -= (this.height * l)));
            }
        }
    }

    public calculateHeight(looped: boolean) {
        let measureCount = looped ? this.maxMeasureCount : this.measureCount; 
        return measureCount * this.calculateSingleMeasureHeight(); 
    }
    
    public calculateSingleMeasureHeight() {
        return this.timeSignature[0] * this.noteGap;
    }
    
    public calculateTopOfLane(looped: boolean) {
        if(looped)
            return this.startY - this.loopedHeight; 
        return this.startY - this.height; 
    }   

    public calcualteTopOfMeasuresN(n: number) {
        return this.startY - (this.calculateSingleMeasureHeight() * n); 
    }
    
    public updateMaxMeasureCount(maxMeasureCount: number) {
        this.maxMeasureCount = maxMeasureCount; 
        // TODO: Remove looped notes array. If current measure count is greater, remove notes. 
    }

    public loadPattern(selectedPattern: selectedPattern, measures: number) {
        if(this.patternStartMeasure + (measures * selectedPattern.measures) > this.measureCount) {
            console.error("Loading this pattern will exceed the lane's measure limit", measures, selectedPattern.measures, this.measureCount);
            return; 
        }
        console.log(selectedPattern);

        let notePositions = selectedPattern.notePositions;
        console.log(notePositions, measures);
        
        let divider = 16/this.timeSignature[1]; 
        let height = this.noteGap/divider; 
        
        for(let i = 0; i < measures; i++) {
            let patternStartY = this.startY - (this.patternStartMeasure * (this.noteGap * this.timeSignature[1]));
            for(let x = 0; x < notePositions.length; x++) {
                let y = patternStartY - (height * -notePositions[x])
                if(y <= this.calculateTopOfLane(false))
                    return; // So that notes in patterns longer than the lane's measure length won't overfill it
                let newNoteIndex = (this.startY - y) / (this.noteGap/this.timeSignature[1]);

                this.notes.push(new Note(newNoteIndex)); 
            }
            this.patternStartMeasure += 1; 
        }
        console.log(this.notes);
    }    

    public handleResize() {
        console.log("Handling resize");
        /*
            Reset: 
            startY,
            height, 
            effectiveHeight,
            topOfLane,
            topOfInputVisual,
            inputAreaHeight,
        */
        this.startY = this.calculatePerfectHitY() - this.noteGap;
        this.height = this.calculateHeight(false);
        this.loopedHeight = this.calculateHeight(true);
        this.topOfLane = this.calculateTopOfLane(this.looped); 
        this.topOfInputVisual = this.canvas.height - 70;
        this.inputAreaHeight = this.canvas.height - this.topOfInputVisual;
        this.hitzone = this.calculateHitzone(); 
    }
}
