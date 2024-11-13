import Note from "./Note.ts";
import Hitzone from "./Hitzone.ts";

export default class Lane {
    public bpm: number;
    public measureCount: number; 
    public timeSignature: number[]; // Index 0 will be the upper numeral, index 1 the lower

    public notes?: Note[];
    // Defines the distance between full* notes
    public noteGap: number; 
    public nextNoteIndex: number; 

    public hitzone: Hitzone; 
    public hitsound: String; 

    // The height above the hitzone that notes will be populated upon run start
    public startY: number; 
    public height: number; 

    public notesHit: Note[] = [];
    public notesMissed: Note[] = [];
    public wrongNotes: Note[] = []; 

    public maxWrongNotes: number; 

    private canvasHeight: number; 

    constructor(
        bpm: number, 
        measureCount: number, 
        noteGap: number,
        hitsound: String, 
        maxWrongNotes: number,
        notes: Note[],
        timeSignature: number[],
        canvasHeight: number
    ) {
        this.bpm = bpm; 
        this.measureCount = measureCount;
        this.timeSignature = timeSignature;

        this.notes = notes; 
        // Note gap defines the distance between between note values that the time signature is counting
        this.noteGap = noteGap;
        
        this.hitsound = hitsound; 

        this.maxWrongNotes = maxWrongNotes;
        
        this.canvasHeight = canvasHeight;
        // TODO: Decide if this level of dynamic sizing is even necessary.
        let measure32ndNote = this.noteGap / (32/this.timeSignature[1])
        let early_hit_y = this.canvasHeight - (this.canvasHeight * 0.25); 
        let perfect_hit_y = early_hit_y + measure32ndNote; 
        let late_hit_y = perfect_hit_y + measure32ndNote/2; 
        this.hitzone = new Hitzone(early_hit_y, measure32ndNote, perfect_hit_y, measure32ndNote/2, late_hit_y, measure32ndNote); 

        // So that the first note drawn will be exaclty one full note above the perfect hit area
        // this.startY = hitzone.perfect_hit_y - this.noteGap;

        // timeSignature[0] represents the upper numeral (the number of notes per bar)
        this.height = measureCount * (this.timeSignature[0] * this.noteGap); 
        this.nextNoteIndex = 0; 
    }

    public setNotes(notes: Note[]): void { this.notes = notes; }

    public incrementNoteIndex() { this.nextNoteIndex++; }

    public resetNoteIndex() { this.nextNoteIndex = 0; }

    public drawInputVisual(ctx: CanvasRenderingContext2D) {

    }

    public drawHitzone(ctx: CanvasRenderingContext2D, width: number) {
        this.hitzone.drawHitZone(ctx, width);
    }
}
