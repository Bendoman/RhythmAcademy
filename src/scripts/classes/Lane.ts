import Note from "./Note.ts";
import Hitzone from "./Hitzone.ts";
import { currentTime, global_volume, longest_lane, measureHeight } from "../main.ts";
import { selectedPattern } from "../types.ts";
import { drawLine, getNoteFill } from "../helpers/utils.ts";
import { COLORS, EDIT_MODES, HIT_STATUSES, ZONE_NAMES } from "../helpers/constants.ts";

export default class Lane {
    public bpm: number;
    public measureCount: number; 
    public timeSignature: number[]; // Index 0 will be the upper numeral, index 1 the lower
    public autoPlayEnabled: boolean; 
    public metronomeEnabled: boolean; 

    // The number by which measure height is divided by to determine beat markers
    public subdivision: number; 
    public innerSubdivision: number; 

    // Defines the distance between full* notes
    public noteGap: number; 
    public nextNoteIndex: number; 
    
    public hitzone: Hitzone; 
    public hitsound: string; 
    public inputAreaHeight: number;
    
    // The height above the hitzone that notes will be populated upon run start
    public startY: number; 
    public height: number; 
    public topOfInputVisual: number;
    
    public notes: Note[];
    public loopCount: number; 
    public repeated: boolean;
    public repeatedNotes: number;
    
    public noFail: boolean; 
    public maxWrongNotes: number; 
    public notesHit: Note[] = [];
    public notesMissed: Note[] = [];
    public wrongNotes: Note[] = []; 
    
    public inputKey: string; 
    public keyAlias: string | null; 
    public pressed: boolean;
    
    public hitPrecision: number; 
    public patternStartMeasure: number; 
    
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    public translationAmount: number; 
    
    public volume: number;
    public audioSprite: any;
    public lastMetronomeTick: number; 
    
    public fullyScrolled: boolean;

    constructor(
        bpm: number, 
        measureCount: number, 
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
        this.timeSignature = timeSignature;

        this.subdivision = 4; 
        this.innerSubdivision = 4; 

        this.notes = notes; 
        this.repeated = false; 
        this.repeatedNotes = 0;
        this.nextNoteIndex = 0; 

        // Note gap defines the distance between between note values that the time signature is counting
        this.noteGap = noteGap;
        // TODO: Time signatures THIS WORKS LETS GO
        this.noteGap = measureHeight / this.subdivision;
        
        // this.timeSignature = [8, 8];
        // this.noteGap = measureHeight/8; 
        
        this.hitsound = hitsound; 
        this.maxWrongNotes = maxWrongNotes;
        this.noFail = false; 
        
        this.canvas = canvas; 
        this.ctx = this.canvas.getContext('2d')!; 

        this.hitPrecision = hitPrecision;
        this.hitzone = this.calculateHitzone(); 

        // So that the first note drawn will be exaclty one full note above the perfect hit area
        // this.startY = this.calculatePerfectHitY() - this.noteGap;
        this.startY = this.calculatePerfectHitY() - (measureHeight/this.timeSignature[1]);
                
        // this.height = this.measureCount * this.calculateSingleMeasureHeight();
        this.height = this.measureCount * measureHeight;
        this.topOfInputVisual = this.canvas.height - 70;

        this.inputKey = inputKey;
        this.keyAlias = null; 
        this.inputAreaHeight = this.canvas.height - this.topOfInputVisual;
        
        this.loopCount = 1; 
        this.pressed = false;
        this.fullyScrolled = false; 
        this.translationAmount = 0; 
        this.patternStartMeasure = 0; 

        this.autoPlayEnabled = false; 
        this.metronomeEnabled = false;
        this.lastMetronomeTick = 0; 

        this.volume = 1; 
    }

    public recalculateNoteGap() {
        this.noteGap = measureHeight / this.subdivision;

        if(this.subdivision < 4) {
            this.innerSubdivision = 6;
        } else if(this.subdivision < 7) {
            this.innerSubdivision = 4;
        } else {
            this.innerSubdivision = 2; 
        }
    }

    public recalculateHeight() {
        // Number of measures, times the height of a single measure 
        // this.height = this.measureCount * this.calculateSingleMeasureHeight();
        this.height = this.measureCount * measureHeight;
    }

    public calculateSingleMeasureHeight() {
        // timeSignature[0] represents the upper numeral (the number of notes per bar)
        return this.timeSignature[0] * this.noteGap;
    }
    
    public calculateTopOfLane(repeated: boolean) {
        if(repeated)
            return this.startY - longest_lane.getRatio() * this.bpm;
        
        return this.startY - this.height; 
    }   

    public calculateTopOfMeasuresN(n: number) {
        return this.startY - (measureHeight * n); 
    }

    public getRatio() {
        return this.height / this.bpm; 
    }

    public resetLane(overshoot?: number) { 
        if(overshoot) {
            // Lane is being looped
            this.loopCount++; 
        } else {
            this.loopCount = 1;
            this.notesHit = [];
            this.wrongNotes = [];
            this.notesMissed = [];
        }

        this.fullyScrolled = false;
        this.translationAmount = overshoot ? -overshoot : 0; 
        for(let i = 0; i < this.notes.length; i++) {
            let note = this.notes[i];
            note.resetNote();
        }
        this.nextNoteIndex = 0; 
        this.lastMetronomeTick = 0; 
    }

    public handleInputOn(paused: boolean) { 
        this.pressed = true; 
        // Sets pressed so that input modes can be tested, but returns after so that notes can't be hit
        if(paused)
            return; 

        let nextNote = this.notes[this.nextNoteIndex];
        if(nextNote == null) {
            this.audioSprite.play('wrongNote', global_volume * 0.25);
            return; 
        }

        let noteCopy = new Note(nextNote.index);
        noteCopy.currentZone = nextNote.currentZone;
        noteCopy.hitStatus = nextNote.hitStatus;
        noteCopy.timeToZone = nextNote.timeToZone; 

        switch(nextNote.currentZone) {
            case ZONE_NAMES.EARLY_ZONE:
                // console.log(`Wrong note:\nTime to zone: ${nextNote.timeToZone}\nZone: ${nextNote.currentZone}`);
                if(this.audioSprite)
                    this.audioSprite.play("wrongNote", global_volume * 0.25);
                noteCopy.timeHit = parseInt(currentTime.toFixed(0));
                this.wrongNotes.push(noteCopy); 
                break;
            case ZONE_NAMES.EARLY_HIT_ZONE:
                // console.log(`Early hit:\nTime to zone: ${nextNote.timeToZone}\nZone: ${nextNote.currentZone}`);
                if(this.audioSprite)
                    this.audioSprite.play(this.hitsound, global_volume);
                nextNote.hitStatus = 'hit';
                noteCopy.hitStatus = 'hit';
                noteCopy.timeHit = parseInt(currentTime.toFixed(0));
                this.notesHit.push(noteCopy);
                this.nextNoteIndex++;
                nextNote.startAnimation('hit'); 
                break;
            case ZONE_NAMES.PERFECT_HIT_ZONE:
                // console.log(`Perfect hit:\nTime to zone: ${nextNote.timeToZone}\nZone: ${nextNote.currentZone}`);
                if(this.audioSprite)
                    this.audioSprite.play(this.hitsound, global_volume);
                nextNote.hitStatus = 'hit';
                noteCopy.hitStatus = 'hit';
                noteCopy.timeHit = parseInt(currentTime.toFixed(0));
                this.notesHit.push(noteCopy);
                this.nextNoteIndex++;
                nextNote.startAnimation('perfect_hit'); 
                break;
            case ZONE_NAMES.LATE_HIT_ZONE:
                // console.log(`Late hit:\nTime to zone: ${nextNote.timeToZone}\nZone: ${nextNote.currentZone}`);
                if(this.audioSprite)
                    this.audioSprite.play(this.hitsound, global_volume);
                nextNote.hitStatus = 'hit';
                noteCopy.hitStatus = 'hit';
                noteCopy.timeHit = parseInt(currentTime.toFixed(0));
                this.notesHit.push(noteCopy);
                this.nextNoteIndex++;
                nextNote.startAnimation('hit'); 
                break;
        }
    }

    public handleInputOff() { this.pressed = false; }

    public drawInputVisual() {
        this.ctx.fillStyle = this.pressed ? COLORS.PRESSED_INPUT_FILL : COLORS.UNPRESSED_INPUT_FILL;
        drawLine(this.ctx, 0, this.topOfInputVisual, this.canvas.width, this.topOfInputVisual, 'black', 2);
        this.ctx.fillRect(0, this.topOfInputVisual, this.canvas.width, this.inputAreaHeight);

        this.ctx.fillStyle = this.pressed ? COLORS.INPUT_KEY_PRESSED : COLORS.INPUT_KEY_UNPRESSED;
        this.ctx.font = "italic 50px Inria-serif"

        let displayedInput = this.keyAlias ? this.keyAlias : this.inputKey.toUpperCase(); 
        let textWidth = this.ctx.measureText(displayedInput).width;

        this.ctx.fillText(displayedInput, this.canvas.width/2 - (textWidth / 2), this.topOfInputVisual + 50); 
    }

    // let inverse = ((newNoteIndex * (lane.noteGap/lane.timeSignature[1])) - lane.startY) * -1;
    // Draws all notes and repeated notes to the screen
    public updateAndDrawNotes(editing: boolean, ups: number, translationSpeed: number, noteOverride?: Note[]) {
        let notesArray = noteOverride ? noteOverride : this.notes;
        for(let i = 0; i < notesArray.length; i++) {
            let note;
            if(noteOverride)
                note = noteOverride[i]; 
            else
                note = this.notes[i]; 
            
            let effectiveY = note.getY(this.noteGap, this.innerSubdivision, this.startY) + this.translationAmount;
            // Reduces time spent drawing notes that have scrolled passed the bottom of the screen
            if(effectiveY > this.canvas.height)
                continue;
            // Does not loop through any notes that won't be dispalyed on the screen
            // -noteGap instead of 0 as notes are on a slight y offset and would pop in
            if(effectiveY < -this.noteGap) 
                return;
            
            if(!editing) 
                this.updateNote(note, effectiveY, ups, translationSpeed);
            this.drawNote(note, effectiveY, editing);
        }
    }

    public drawNote(note: Note, y: number, editing: boolean) {
        let x = (this.canvas.width/2) - (this.canvas.width/4);
        let width = this.canvas.width/2;

        if(editing) {
            this.ctx.fillStyle = getNoteFill(ZONE_NAMES.EARLY_ZONE, HIT_STATUSES.UNHIT); 
        } else {
            this.ctx.fillStyle = getNoteFill(note.currentZone, note.hitStatus); 
            if(this.notes.indexOf(note) == this.nextNoteIndex)
                this.ctx.fillStyle = COLORS.NEXT_NOTE_FILL;
        }
        
        let height = 12.5;
        if(!editing && note.animationHeight > 0) {
            height += note.animationHeight;
            note.animationHeight--; 
        }       

        this.ctx.beginPath();
        this.ctx.roundRect(x, y - (height/2), width, height, 20);
        this.ctx.fill();
    }

    // Updates the hitzone and hitstatus of a specific note
    public updateNote(note: Note, y: number, ups: number, translationSpeed: number) {
        let distanceToPerfectHitzone = 
        ((this.hitzone.perfect_hit_y - this.translationAmount) - note.getY(this.noteGap, this.innerSubdivision, this.startY));

        if(note.hitStatus == 'unhit')
            note.timeToZone = ((distanceToPerfectHitzone/translationSpeed)/ups)*1000;

        if(y > this.hitzone.early_hit_y && note.currentZone == ZONE_NAMES.EARLY_ZONE) {
            note.currentZone = ZONE_NAMES.EARLY_HIT_ZONE;
        } else if(y > this.hitzone.perfect_hit_y && note.currentZone == ZONE_NAMES.EARLY_HIT_ZONE) {
            note.currentZone = ZONE_NAMES.PERFECT_HIT_ZONE;
            if(this.audioSprite && this.autoPlayEnabled)
                this.audioSprite.play(this.hitsound, global_volume * 0.25);
        } else if(y > this.hitzone.late_hit_y && note.currentZone == ZONE_NAMES.PERFECT_HIT_ZONE) {
            note.currentZone = ZONE_NAMES.LATE_HIT_ZONE;
        } else if(y > this.hitzone.late_hit_y + this.hitzone.late_hit_height && note.currentZone == ZONE_NAMES.LATE_HIT_ZONE) {
            note.currentZone = ZONE_NAMES.MISS_ZONE;
            if(this.notes.indexOf(note) == this.nextNoteIndex) {
                note.hitStatus = 'missed';
                this.nextNoteIndex++;
                let noteCopy = new Note(note.index);
                noteCopy.currentZone = note.currentZone;
                noteCopy.hitStatus = note.hitStatus;
                noteCopy.timeHit = parseInt(currentTime.toFixed(0));
                this.notesMissed.push(noteCopy); 
            }
        }
    }

    public drawHitzone() {
        this.hitzone.drawHitZone(this.ctx, this.canvas.width, this.canvas.height);
    }
    
    public drawMeasureIndicators(editMode?: string, newPatternMeasures?: number) {
        let noteCount = 1; 

        let topOfLane = this.calculateTopOfLane(this.repeated);
        if(newPatternMeasures && editMode && editMode == EDIT_MODES.CREATE_PATTERN_MODE)
            topOfLane = this.calculateTopOfMeasuresN(newPatternMeasures)

        for(let y = this.startY; y > topOfLane; y -= this.noteGap) {
            // Optimisation so that only the measure lines actually visible on the page need to be drawn
            if(y + this.translationAmount > this.canvas.height) {
                noteCount++;
                // Resets the note count back to 1 after reaching the maximum defined by the time signature
                if(noteCount > this.subdivision) 
                    noteCount = 1;
                continue; 
            }
            
            if(y + this.translationAmount < 0) {
                return; 
            }

            // So that the actual y values can be held constant
            let effectiveY = y + this.translationAmount;
            drawLine(this.ctx, 30, effectiveY, this.canvas.width - 30, effectiveY, COLORS.MEASURE_LINE, 1);

            // Emphasises the first note of a bar by giving it bigger text
            this.ctx.fillStyle = COLORS.MEASURE_NUMBER;
            if(noteCount == 1) {
                this.ctx.font = "italic 36px Inria-serif"
                this.ctx.fillText(noteCount.toString(), 6, y + 10 + this.translationAmount);
            } else {
                this.ctx.font = "italic 20px Inria-serif"
                this.ctx.fillText(noteCount.toString(), 10, y + 5 + this.translationAmount);
            }

            noteCount++;
            // Resets the note count back to 1 after reaching the maximum defined by the time signature
            if(noteCount > this.subdivision) 
                noteCount = 1;
        }
        if(!this.repeated) {
            drawLine(this.ctx, 0, topOfLane + this.translationAmount, this.canvas.width, topOfLane + this.translationAmount, COLORS.MEASURE_LINE, 1, [25, 5]);
        }
    }

    public drawLoopIndicator() {
        let effectiveY = this.startY + this.translationAmount + (measureHeight/this.timeSignature[1]);

        let text = 'End of Lane'; 
        this.ctx.font = "italic 20px Inria-serif"
        this.ctx.fillStyle = COLORS.MEASURE_NUMBER;
        let textWidth = this.ctx.measureText(text).width; 
        this.ctx.fillText(text, (this.canvas.width/2) - (textWidth/2), effectiveY - 10);

        drawLine(this.ctx, (this.canvas.width/2) - 50, effectiveY, 
        (this.canvas.width/2) + 50, effectiveY, COLORS.MEASURE_LINE, 1, [25, 5]);
        drawLine(this.ctx, 0, effectiveY, this.canvas.width, effectiveY, COLORS.MEASURE_LINE, 1, [25, 5]);

    }

    public clearCanvas() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height - this.inputAreaHeight);
    }

    public calculatePerfectHitY() { 
        return this.canvas.height - (this.canvas.height * 0.15); 
    }

    public calculateHitzone(): Hitzone {
        // TODO: Decide if this level of dynamic sizing is even necessary.
        let nonPerfectHitArea = ((measureHeight/this.timeSignature[1]) / ((this.hitPrecision*2) / this.timeSignature[1])) /2; //TODO: Write justifcation for this
        let perfectHitArea = ((measureHeight/this.timeSignature[1]) / (32/this.timeSignature[1])) / 2;

        let perfect_hit_y = this.calculatePerfectHitY();
        let early_hit_y = perfect_hit_y - nonPerfectHitArea
        let late_hit_y = perfect_hit_y + perfectHitArea; 

        return new Hitzone(early_hit_y, nonPerfectHitArea, perfect_hit_y, perfectHitArea, late_hit_y, nonPerfectHitArea); 
    }

    public repeatNotes() {
        this.repeated = true; 
        
        let l = 1;
        let highestNoteY = 0;         
        let length = this.notes.length; 
        this.repeatedNotes = 0; 

        if(this.notes.length == 0)
            return; 

        let repeatedHeight = longest_lane.getRatio() * this.bpm;
        while(highestNoteY >= this.startY - repeatedHeight) {
            for(let i = 0; i < length; i++) {
                let newNoteY = this.notes[i].getY(this.noteGap, this.innerSubdivision, this.startY) - (this.height * l);
                let newNoteIndex = (this.startY - newNoteY) / (this.noteGap/this.innerSubdivision);
                highestNoteY = newNoteY; 

                if(highestNoteY <= this.startY - repeatedHeight)
                    return; 

                let newNote = new Note(newNoteIndex);

                this.notes.push(newNote); 
                this.repeatedNotes++; 
            }
            l++;
        }
    }

    public unrepeatNotes() {
        this.notes.splice(this.notes.length - this.repeatedNotes, this.repeatedNotes);
        this.repeatedNotes = 0;
        this.repeated = false; 
    }

    public cullOutOfBoundsNotes() {
        if(this.notes.length == 0)
            return; 

        for(let i = this.notes.length - 1; i >= 0; i--) {
            if(this.notes[i].getY(this.noteGap, this.innerSubdivision, this.startY) <= this.calculateTopOfLane(false))
                this.notes.splice(i, 1); 
        }
    }

    public loadPattern(selectedPattern: selectedPattern, occurances: number, startMeasure?: number, spliceIndex?: number, difference?: number) {
        if(startMeasure == undefined && this.patternStartMeasure + (occurances * selectedPattern.measures) > this.measureCount) {
            console.error("Loading this pattern will exceed the lane's measure limit", occurances, selectedPattern.measures, this.measureCount);
            return -1; 
        }

        let startingMeasure; 
        if(startMeasure != undefined)
            startingMeasure = startMeasure 
        else 
            startingMeasure = this.patternStartMeasure;

        let notePositions = selectedPattern.notePositions;
        let newNotes = []; 
        let startingNotesLength = this.notes.length; 
        for(let i = 0; i < occurances; i++) {
            let patternStartY = this.startY - (startingMeasure * (this.noteGap * this.subdivision));
            let patternStartIndex = Math.round(parseInt(((this.startY - patternStartY) / (this.noteGap/this.innerSubdivision)).toFixed(1)));

            for(let x = 0; x < notePositions.length; x++) {
                let newNote = new Note(patternStartIndex + notePositions[x]);
                let y = newNote.getY(this.noteGap, this.innerSubdivision, this.startY);
                
                if(y <= this.calculateTopOfLane(false))
                    return; // So that notes in patterns longer than the lane's measure length won't overfill it

                
                if(spliceIndex != undefined && startingNotesLength > 0)
                    newNotes.push(newNote);
                else 
                    this.notes.push(newNote); 
            }
            startingMeasure += selectedPattern.measures;
        }

        if(spliceIndex != undefined) {
            for(let i = 0; i < newNotes.length; i++) {
                this.notes.splice(spliceIndex + i, 0, newNotes[i]); 
            }
        }

        if(startMeasure == undefined) {
            this.setPatternStartMeasure(startingMeasure);
        } else {
            this.setPatternStartMeasure(this.patternStartMeasure + difference!);
        }
    }    

    public handleResize() {
        /*
            Reset: 
            startY,
            height, 
            effectiveHeight,
            topOfLane,
            topOfInputVisual,
            inputAreaHeight,
        */
        this.startY = this.calculatePerfectHitY() - (measureHeight/this.timeSignature[1]);
        this.recalculateHeight(); 
        this.topOfInputVisual = this.canvas.height - 70;
        this.inputAreaHeight = this.canvas.height - this.topOfInputVisual;
        this.hitzone = this.calculateHitzone(); 
    }

    private patternStartListeners: ((newValue: number) => void)[] = [];
    // Custom event listeners 
    public setPatternStartMeasure(value: number) {
        if (this.patternStartMeasure !== value) {
            this.patternStartMeasure = value;
            this.notifyPatternStartChange();
        }
    }

    private notifyPatternStartChange() {
        for (const listener of this.patternStartListeners) {
            listener(this.patternStartMeasure);
        }
    }

    // Allow external code to listen for changes
    public onPatternStartChange(callback: (value: number) => void) {
        this.patternStartListeners.push(callback);
    }

    public removePatternStartChange(callback: (value: number) => void) {
        this.patternStartListeners = this.patternStartListeners.filter(cb => cb !== callback);
    }

    private patternChangeListeners: ((startMeasure: number, measureDifference: number) => void)[] = [];
    public onPatternChange(callback: (startMeasure: number, measureDifference: number) => void) {
        this.patternChangeListeners.push(callback); 
    }

    public removeOnPatternChange(callback: (startMeasure: number, measureDifference: number) => void) {
        this.patternChangeListeners = this.patternChangeListeners.filter(cb => cb !== callback);
    }

    private notifyPatternChange(startMeasure: number, measureDifference: number) {
        for (const listener of this.patternChangeListeners) {
            listener(startMeasure, measureDifference);
        }
    }

    public reducePatternOccuances(startMeasure: number, measures: number, oldOccurances: number, newOccurnaces: number) {
        if(newOccurnaces > oldOccurances)
            return; 
        
        let revertRepeat = false;
        if(this.repeated) {
            this.unrepeatNotes();
            revertRepeat = true;
        }
        
        let measureDifference = (oldOccurances - newOccurnaces) * measures;         
        let patternStartY = this.startY - (startMeasure * (this.noteGap * this.subdivision));
        let patternStartIndex = Math.round(parseInt(((this.startY - patternStartY) / (this.noteGap/this.innerSubdivision)).toFixed(1)));

        let notesInMeasure = this.innerSubdivision * this.subdivision;
        let lastPossibleIndex = patternStartIndex + (notesInMeasure * measures * oldOccurances) - 1; 

        if(newOccurnaces > 0)
            patternStartIndex = lastPossibleIndex - (measureDifference * notesInMeasure);
        
        for(let i = this.notes.length - 1; i >= 0; i--) {
            if(this.notes[i].index < patternStartIndex) {
                break; 
            } else if(this.notes[i].index > lastPossibleIndex) {
                // Reached past pattern
                this.notes[i].index -= (measureDifference * notesInMeasure); 
                continue;
            } else {
                // Notes within the pattern
                this.notes.splice(i, 1);
            }
        }

        this.notifyPatternChange(startMeasure, -measureDifference);

        let newPatternStartMeasure = this.patternStartMeasure - measureDifference;
        this.setPatternStartMeasure(newPatternStartMeasure < 0 ? 0 : newPatternStartMeasure);

        if(this.notes.length == 0)
            this.setPatternStartMeasure(0);

        
        if(revertRepeat)
            this.repeatNotes();
    }

    public increasePatternOccurances(startMeasure: number, measures: number, oldOccurances: number, newOccurnaces: number, patternData: {measures: number}): number {        
        if(newOccurnaces < oldOccurances)
            return -1; 

        let revertRepeat = false;
        if(this.repeated) {
            this.unrepeatNotes();
            revertRepeat = true;
        }

        let measureDifference = (newOccurnaces - oldOccurances) * measures; 

        if(this.patternStartMeasure + measureDifference > this.measureCount) { return -1; }
        
        let patternStartY = this.startY - (startMeasure * (this.noteGap * this.subdivision));
        let patternStartIndex = Math.round(parseInt(((this.startY - patternStartY) / (this.noteGap/this.innerSubdivision)).toFixed(1)));


        let notesInMeasure = this.innerSubdivision * this.subdivision;

        let spliceIndex; 

        let lastPossibleIndex = patternStartIndex + (notesInMeasure * measures * oldOccurances) - 1; 
        for(let i = this.notes.length - 1; i >= 0; i--) {
            if(this.notes[i].index < lastPossibleIndex && this.notes[i].index >= patternStartIndex) {
                // Inside pattern
                spliceIndex = i; 
                this.notes.splice(i, 1);
            } else if(this.notes[i].index < patternStartIndex && spliceIndex == undefined) {
                spliceIndex = i + 1; 
                break; 
            } else if(i == 0 && spliceIndex == undefined) {
                spliceIndex = 0; 
            } else if(this.notes[i].index > lastPossibleIndex && measureDifference > 0) {
                this.notes[i].index += (measureDifference * notesInMeasure); 
                continue;
            } 
        }

        // @ts-ignore
        this.loadPattern(patternData, newOccurnaces, startMeasure, spliceIndex, measureDifference);
        this.notifyPatternChange(startMeasure, measureDifference);

        if(revertRepeat)
            this.repeatNotes();
        
        return 0; 
    }
}
