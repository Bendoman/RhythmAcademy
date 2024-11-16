import Note from "./Note.ts";
import Hitzone from "./Hitzone.ts";
import { drawLine } from "./Utils";
import { COLORS } from "./constants";

// TODO: Make sure that values relient on height can be updated when the window size changes. Have an update function for this. 

export default class Lane {
    public bpm: number;
    public measureCount: number; 
    public timeSignature: number[]; // Index 0 will be the upper numeral, index 1 the lower

    // Defines the distance between full* notes
    public noteGap: number; 
    public nextNoteIndex: number; 
    
    public hitzone: Hitzone; 
    public hitsound: String; 
    
    // The height above the hitzone that notes will be populated upon run start
    public startY: number; 
    public height: number; 
    
    public notes: Note[];
    public notesHit: Note[] = [];
    public notesMissed: Note[] = [];
    public wrongNotes: Note[] = []; 

    public maxWrongNotes: number; 

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

    constructor(
        bpm: number, 
        measureCount: number, 
        noteGap: number,
        hitsound: String, 
        maxWrongNotes: number,
        notes: Note[],
        timeSignature: number[],
        inputKey: string,
        canvas: HTMLCanvasElement
    ) {
        this.bpm = bpm; 
        this.measureCount = measureCount;
        this.timeSignature = timeSignature;

        this.notes = notes; 
        // Note gap defines the distance between between note values that the time signature is counting
        this.noteGap = noteGap;
        
        this.hitsound = hitsound; 

        this.maxWrongNotes = maxWrongNotes;
        
        this.canvas = canvas; 
        this.ctx = this.canvas.getContext('2d')!; 

        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
        // TODO: Decide if this level of dynamic sizing is even necessary.
        let measure32ndNote = this.noteGap / (32/this.timeSignature[1])
        let early_hit_y = this.canvasHeight - (this.canvasHeight * 0.25); 
        let perfect_hit_y = early_hit_y + measure32ndNote; 
        let late_hit_y = perfect_hit_y + measure32ndNote/2; 
        this.hitzone = new Hitzone(early_hit_y, measure32ndNote, perfect_hit_y, measure32ndNote/2, late_hit_y, measure32ndNote); 
        
        // So that the first note drawn will be exaclty one full note above the perfect hit area
        this.startY = perfect_hit_y - this.noteGap;
        
        // timeSignature[0] represents the upper numeral (the number of notes per bar)
        this.height = measureCount * (this.timeSignature[0] * this.noteGap); 
        this.topOfLane = this.startY - this.height; 
        this.topOfInputVisual = this.canvasHeight - 70;
        this.nextNoteIndex = 0; 

        this.inputKey = inputKey;
        this.inputAreaHeight = this.canvasHeight - this.topOfInputVisual;

        this.translationAmount = 0; 
        this.pressed = false;
    }

    public setNotes(notes: Note[]): void { this.notes = notes; }

    public incrementNoteIndex() { this.nextNoteIndex++; }

    public resetNoteIndex() { this.nextNoteIndex = 0; }

    public handleInputOn() { this.pressed = true; }

    public handleInputOff() { this.pressed = false; }

    public drawInputVisual() {
        this.ctx.fillStyle = this.pressed ? COLORS.PRESSED_INPUT_FILL : COLORS.UNPRESSED_INPUT_FILL;
        drawLine(this.ctx, 0, this.topOfInputVisual, this.canvasWidth, this.topOfInputVisual, 'black', 2);
        this.ctx.fillRect(0, this.topOfInputVisual, this.canvasWidth, this.inputAreaHeight);

        this.ctx.fillStyle = this.pressed ? COLORS.INPUT_KEY_PRESSED : COLORS.INPUT_KEY_UNPRESSED;
        this.ctx.font = "italic 50px Inria-serif"
        this.ctx.fillText(this.inputKey.toUpperCase(), this.canvasWidth/2 - 20, this.topOfInputVisual + 50); 
    }


    public drawNotes() {
        if(!this.notes)
            return;     

        for(let i = 0; i < this.notes.length; i++) {
            let note = this.notes[i];

            // Reduces time spent drawing notes that have scrolled passed the bottom of the screen
            if(note.y + this.translationAmount > this.canvasHeight)
                continue;

            if(note.y + this.translationAmount < 0)
                return;

            note.drawNote(this.ctx, this.translationAmount, this.topOfInputVisual); 
        }
    }

    public drawHitzone() {
        this.hitzone.drawHitZone(this.ctx, this.canvasWidth);
    }
    
    public drawMeasureIndicators() {
        let noteCount = 1; 
        for(let y = this.startY; y > this.topOfLane; y -= this.noteGap) {
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
            drawLine(this.ctx, 30, effectiveY, this.canvasWidth - 30, effectiveY,COLORS.MEASURE_LINE, 1);

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
}
