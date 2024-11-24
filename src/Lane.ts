import Note from "./Note.ts";
import Hitzone from "./Hitzone.ts";
import { drawLine, getNoteFill } from "./Utils";
import { COLORS, HIT_STATUSES, ZONE_NAMES } from "./constants";
import AudioSprite from "./AudioSprite.ts";

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
    public effectiveHeight: number; 
    
    public notes: Note[];
    public looped: boolean;
    public loopedNotes: number;
    public nonLoopedNotes: any;

    public notesHit: Note[] = [];
    public notesMissed: Note[] = [];
    public wrongNotes: Note[] = []; 

    public maxWrongNotes: number; 

    // TODO: Remove 
    public canvasWidth: number; 
    public canvasHeight: number; 

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

        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
        
        this.hitPrecision = hitPrecision;

        this.hitzone = this.calculateHitzone(); 

        
        // So that the first note drawn will be exaclty one full note above the perfect hit area
        this.startY = this.calculatePerfectHitY() - this.noteGap;
        
        // timeSignature[0] represents the upper numeral (the number of notes per bar)
        // this.height = measureCount * (this.timeSignature[0] * this.noteGap); 
        // this.topOfLane = this.startY - this.height; 
        
        this.height = this.calculateHeight(false);
        this.effectiveHeight = this.calculateHeight(true);

        // this.effectiveHeight = this.calculateHeight(true); 
        this.topOfLane = this.calculateTopOfLane(false); 

        this.topOfInputVisual = this.canvasHeight - 70;
        this.nextNoteIndex = 0; 

        this.inputKey = inputKey;
        this.inputAreaHeight = this.canvasHeight - this.topOfInputVisual;

        this.translationAmount = 0; 
        this.pressed = false;
        this.metronomeEnabled = false;

        this.metronomeSound = 'metronome1';
    }

    public setNotes(notes: Note[]): void { this.notes = notes; }

    public incrementNoteIndex() { this.nextNoteIndex++; }

    public recalculateHeight() {
        this.height = this.measureCount * (this.timeSignature[0] * this.noteGap); 
        this.topOfLane = this.startY - this.height;
    }

    // TODO: Give this better name and have one that also removes all notes 
    public resetLane() { 
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
        // TODO: Replace this with if else block. check that note is unhit.

        switch(nextNote.currentZone) {
            case ZONE_NAMES.EARLY_ZONE:
                console.log(`Wrong note:\nTime to zone: ${nextNote.timeToZone}\nZone: ${nextNote.currentZone}`);
                break;
            case ZONE_NAMES.EARLY_HIT_ZONE:
                console.log(`Early hit:\nTime to zone: ${nextNote.timeToZone}\nZone: ${nextNote.currentZone}`);
                if(this.audioSprite)
                    this.audioSprite.play(this.hitsound);
                // TODO: Temporary, replace with const
                nextNote.hitStatus = 'hit';
                this.nextNoteIndex++;
                break;
            case ZONE_NAMES.PERFECT_HIT_ZONE:
                console.log(`Perfect hit:\nTime to zone: ${nextNote.timeToZone}\nZone: ${nextNote.currentZone}`);
                if(this.audioSprite)
                    this.audioSprite.play(this.hitsound);
                nextNote.hitStatus = 'hit';
                this.nextNoteIndex++;
                break;
            case ZONE_NAMES.LATE_HIT_ZONE:
                console.log(`Late hit:\nTime to zone: ${nextNote.timeToZone}\nZone: ${nextNote.currentZone}`);
                if(this.audioSprite)
                    this.audioSprite.play(this.hitsound);
                nextNote.hitStatus = 'hit';
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

    // Draws all notes and looped notes to the screen
    public drawNotes(editMode: boolean, ups: number, translationSpeed: number) {
        for(let i = 0; i < this.notes.length; i++) {
            let note = this.notes[i]; 
            let effectiveY = note.y + this.translationAmount;
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

        // for(let i = 0; i < this.loopedNotes.length; i++) {
        //     let note = this.loopedNotes[i]; 
        //     let effectiveY = note.y + this.translationAmount;

        //     if(effectiveY > this.canvas.height)
        //         continue;
        //     if(effectiveY < -this.noteGap) 
        //         return;

        //     if(!editMode) 
        //         this.updateNote(note, effectiveY, ups, translationSpeed);
        //     this.drawNote(note, effectiveY);
        // }


        // if(!editMode) // Only updates the hitstatus of notes if not in edit mode
        //     this.updateNote(note); 
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

        this.ctx.fillStyle = 'white';
        this.ctx.font = "12px sans-serif"
        this.ctx.fillText(`${note.timeToZone.toFixed(1)}ms to zone`, x, y + 3)
    }

    // Updates the hitzone and hitstatus of a specific note
    public updateNote(note: Note, y: number, ups: number, translationSpeed: number) {
        let distanceToPerfectHitzone = ((this.hitzone.perfect_hit_y - this.translationAmount) - note.y)
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
            if(this.notes.indexOf(note) == this.nextNoteIndex)
                this.nextNoteIndex++;
        }
    }


    public updateNotes(ups:number, translationSpeed:number, editMode?: boolean) {
        if(!this.notes)
            return;     

        for(let i = 0; i < this.notes.length; i++) {
            let note = this.notes[i];
            let effectiveY = note.y + this.translationAmount;

            // Reduces time spent drawing notes that have scrolled passed the bottom of the screen
            if(effectiveY > this.canvas.height)
                continue;

            // Does not loop through any notes that won't be dispalyed on the screen
            // -noteGap instead of 0 as notes are on a slight y offset and would pop in
            if(effectiveY < -this.noteGap) 
                return;

            let x = (this.canvas.width/2) - (this.canvas.width/4);
            let width = this.canvas.width/2;

            // TODO: Talk about this with Sean
            let height = this.noteGap/(this.timeSignature[1] * this.timeSignature[0])

            if(height < 5)
                height = 5; 
            
            let nextNote = false;
            if(i == this.nextNoteIndex)
                nextNote = true;

            let currentZone = note.currentZone; 

            // TODO: See about reducing the number of parameters that this function requires
            // TODO: Potentially use a settings object, or restructure so that it is unecessary. Review either way.
            // TODO: Pass editmode boolean so that notes aren't updated while scrolling during editing.
            note.updateNote(this.ctx, this.translationAmount, x, width, height, this.hitzone, this.metronomeSprite, nextNote, ups, translationSpeed, this.metronomeEnabled, this.metronomeSound); 
           
            // Note travels from late hit zone to miss zone, and is unhit 
            if(note.currentZone != currentZone && note.currentZone == ZONE_NAMES.MISS_ZONE && note.hitStatus == 'unhit')
                this.nextNoteIndex++;
        }
    }

    public drawHitzone() {
        this.hitzone.drawHitZone(this.ctx, this.canvas.width);
    }
    
    public drawMeasureIndicators() {
        let noteCount = 1; 
        let topOfLane;
        if(this.looped)
            topOfLane = this.calculateTopOfLane(true);
        else 
            topOfLane = this.calculateTopOfLane(false);

        for(let y = this.startY; y > topOfLane; y -= this.noteGap) {
            // Optimisation so that only the measure lines actually visible on the page need to be drawn
            if(y + this.translationAmount > this.canvasHeight) {
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

            // TODO: Filltext is quite unperformant
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
        return this.canvasHeight - (this.canvasHeight * 0.25); 
    }

    public calculateHitzone(): Hitzone {
        // TODO: Decide if this level of dynamic sizing is even necessary.
        let nonPerfectHitArea = (this.noteGap / ((this.hitPrecision*2)/this.timeSignature[1]))/2; //TODO: Write justifcation for this
        let perfectHitArea = (this.noteGap / (32/this.timeSignature[1]))/2;

        // let early_hit_y = this.canvasHeight - (this.canvasHeight * 0.25); 
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
                let newNote = new Note(this.notes[i].y - (this.height * l));
                this.notes.push(newNote); // Change this to looped notes 
                this.loopedNotes++; 
                console.log('pushing new note');
                // this.notes.push(new Note(this.notes[i].y -= (this.height * l)));
            }
        }
    }

    public calculateHeight(looped: boolean) {
        let measureCount = looped ? this.maxMeasureCount : this.measureCount; 
        return measureCount * (this.timeSignature[0] * this.noteGap); 
    }

    public calculateTopOfLane(looped: boolean) {
        if(looped)
            return this.startY - this.effectiveHeight; 
        return this.startY - this.height; 
    }   
    
    public updateMaxMeasureCount(maxMeasureCount: number) {
        this.maxMeasureCount = maxMeasureCount; 
        // TODO: Remove looped notes array. If current measure count is greater, remove notes. 
    }
}


