// ( Canvas Setup )
let laneCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById('lane1_canvas'));
let ctx = /** @type {CanvasRenderingContext2D} */ laneCanvas.getContext("2d");
// For when multiple lanes are added
// let canvas_contexts = {};

// ( WebAudioAPI Setup )
window.AudioContext = window.AudioContext || window.webkitAudioContext;

// ( Midi Access Setup )
if(navigator.requestMIDIAccess) { // Ensures that MIDI access is enabled in the current browser
    navigator.requestMIDIAccess().then(midi_connection_success, midi_connection_failure);
}
// #region (Global variables)

// WebAudioAPI related
let audioContext;

const contentContainer = document.getElementById('content');

let width = contentContainer.clientWidth;   laneCanvas.width = width / 6;
let height = contentContainer.clientHeight; laneCanvas.height = height * 0.85;

let bpm = 10;
let translationSpeed = 0.6;
let translationAmount = 0; 

let hitzone_start_y = laneCanvas.height - 50;

// DOM Elements
// Inputs
const bpmInput = document.getElementById('BPM_input');

// Buttons
const enableAudioButton = document.getElementById('enable_audio_button');

// Debug displays
const upsParagraph = document.getElementById('ups_pagraph');
const translationParagraph = document.getElementById('translation_pagraph');
// #endregion


// #region (Objects) 
function Lane(height, bpm, notes, note_gap, input_key, hitzone) {
    this.height = height; 
    this.bpm = bpm; 
    this.notes = notes; 
    this.note_gap = note_gap; // Defines the distance between full notes
    this.input_key = input_key;
    this.handleInput = () => { handleLaneInput(this) };
    this.hitzone = hitzone;
}

function Hitzone(early_hit_y, early_hit_height, perfect_hit_y, perfect_hit_height, late_hit_y, late_hit_height) {
    this.early_hit_y = early_hit_y;
    this.early_hit_height = early_hit_height;

    this.perfect_hit_y = perfect_hit_y;
    this.perfect_hit_height = perfect_hit_height; 

    this.late_hit_y = late_hit_y;
    this.late_hit_height = late_hit_height; 
}

// Associates an input key with a given lane
// Keydown event listener will only check for keys in this object
let key_lane_pairs = {};
// #endregion 


// #region (Event listeners)
// Input fields 
enableAudioButton.addEventListener('click', () => { 
    // Fetching BPM from input
    if(audioContext == null) {
        audioContext = new AudioContext();
        console.log(audioContext);
    }
});

bpmInput.addEventListener('change', (event) => {
    let inputValue = parseInt(bpmInput.value);

    // Ensrues that non number values cannot be assigned
    if(isNaN(inputValue)) {
        bpmInput.value = bpm;
        return;
    }

    bpm = bpmInput.value;
    console.log(bpm);
});

// Handles keypresses
window.addEventListener('keydown', (event) => {
    let associated_lane = key_lane_pairs[event.key]
    if(associated_lane != null)
        associated_lane.handleInput();
});

// MIDI related
// TODO: Dynamically update list of available midi inputs 
function updateDevices(event) { console.log(event); }

function processMidiMessage(input) {
    // 153 is on 137 is off
    const command = input.data[0]
    const note = input.data[1]
    const velocity = input.data[2]
    // console.log(command, note, velocity)

    if(velocity > 0) { // See if this is always true
        noteOn(note, velocity)
    } else {
        noteOff(note);
    }
}

function noteOn(note, velocity) {
    console.log(note, velocity);
}

function noteOff(note) {
    console.log(note);
}
// #endregion

// #region (Util functions)
function midi_connection_success(midiAccess) {
    midiAccess.onstatechange = updateDevices;
    const inputs = midiAccess.inputs;

    inputs.forEach(input => { input.onmidimessage = processMidiMessage;});
}
// TODO: Alert the user in input selection menu of the failure
function midi_connection_failure() { console.log('Failed to connect MIDI device'); }

function handleLaneInput(lane) {
    console.log(lane);
}

// For testing purposes, will be replaced.
// Populates lane with as many full notes as will fit within its assigned height
function populateNotes(lane) {
    for(let y = lane.hitzone.early_hit_y - lane.note_gap; y > laneCanvas.height - lane.height; y -= lane.note_gap) {
        lane.notes.push({x:laneCanvas.width/2 - laneCanvas.width/4, y:y, width:laneCanvas.width/2, height:lane.note_gap/8, currentZone:'early', secondsToPerfectHitzone:null}) // Height should be lane.note_gap/8
    }
}

function updateNotes(lane, notes, note_gap) {
    for(let n = 0; n < notes.length; n++) {
        let note = notes[n];

        if(note.y + translationAmount < 0)
            return;

        let disanceToPerfectHitzone = ((lane.hitzone.perfect_hit_y - translationAmount) - note.y)
        let secondsToPerfectHitzone = ((disanceToPerfectHitzone/translationSpeed)/ups).toFixed(2);
        note.secondsToPerfectHitzone = secondsToPerfectHitzone;

        // TODO: Review this with Sean. Should it be done this way or by timings?
        ctx.fillStyle = 'purple';

        if(secondsToPerfectHitzone > 0) {
            // Note is before perfect hit zone
            if(note.y + translationAmount > lane.hitzone.early_hit_y) {
                ctx.fillStyle = 'black';
                if(note.currentZone != 'early_hit') {
                    note.currentZone = 'early_hit';
                }
            } 
        } else {
            // Note is inside or after perfect hit zone
            if(note.y + translationAmount > lane.hitzone.perfect_hit_y && note.y + translationAmount < lane.hitzone.perfect_hit_y + lane.hitzone.perfect_hit_height) {
                // Note is inside perfect hit zone
                ctx.fillStyle = 'green';
                if(note.currentZone != 'perfect_hit') {
                    note.currentZone = 'perfect_hit';
                }
            } else if(note.y + translationAmount > lane.hitzone.late_hit_y && note.y + translationAmount < lane.hitzone.late_hit_y + lane.hitzone.late_hit_height) {
                // Note is inside late hit zone
                ctx.fillStyle = 'yellow';
                if(note.currentZone != 'late_hit') {
                    note.currentZone = 'late_hit';
                }
            } else {
                // Note is inside miss hit zone
                ctx.fillStyle = 'red';
                if(note.currentZone != 'miss') {
                    note.currentZone = 'miss';
                }
            }

        }

        ctx.fillRect(note.x, note.y-1.5 + translationAmount, note.width, 5);

        ctx.fillStyle = 'white';
        ctx.font = "12px sans-serif"
        ctx.fillText(`${note.secondsToPerfectHitzone}s to zone`, note.x + 30, note.y - 2 + translationAmount)
        ctx.fillText(`${note.currentZone}`, note.x + 30, note.y - 15 + translationAmount)
    }
}

// Temporary for testing. Needs to be solidified.
function drawMeasureLines(lane) {
    let barCount = 1; // Only considering 4/4 time signature for now
    for(let y = lane.hitzone.early_hit_y - lane.note_gap; y > laneCanvas.height - lane.height; y -= lane.note_gap) {
        // console.log(y);
        // lane.notes.push({x:0, y:y, width:laneCanvas.width, height:lane.note_gap/8})
        ctx.fillStyle = 'white';
        ctx.fillRect(15, y + translationAmount, laneCanvas.width, 1);

        if(barCount == 1) {
            ctx.font = "20px sans-serif"
            ctx.fillText(barCount, 2, y + 4 + translationAmount)
        } else {
            ctx.font = "10px sans-serif"
            ctx.fillText(barCount, 5, y + 4 + translationAmount)
        }

        barCount++;
        if(barCount > 4)
            barCount = 1;
    }
}

function drawHitZone(lane) {
    // Hitzone should have early hit area and late hit area each half of the note resolution's length.
    let hitzone = lane.hitzone; 
    
    ctx.fillStyle = 'rgba(50, 255, 50, .15)';
    // Perfect hit zone
    ctx.fillRect(0, hitzone.perfect_hit_y, laneCanvas.width, hitzone.perfect_hit_height);

    ctx.fillStyle = 'rgba(255, 255, 50, .15)';
    // Early hit zone
    ctx.fillRect(0, hitzone.early_hit_y, laneCanvas.width, hitzone.perfect_hit_height);    
    // Late hit zone
    ctx.fillRect(0, hitzone.late_hit_y, laneCanvas.width, hitzone.perfect_hit_height);
 
    // TODO: Remove old drawing logic below
    // ctx.fillRect(0, hitzone_start_y- 50, laneCanvas.width, lane.note_gap/16);
    // ctx.fillRect(0, hitzone_start_y - 50 - lane.note_gap/16, laneCanvas.width, lane.note_gap/16);
    // ctx.fillRect(0, hitzone_start_y - 50 + lane.note_gap/16, laneCanvas.width, lane.note_gap/16);
}

function drawLaneBackground(lane) {
    ctx.fillStyle = 'teal';
    ctx.fillRect(0, laneCanvas.height - lane.height, laneCanvas.width, lane.height);
}

// #endregion


// #region (Game loop)
// 
// UPS variables
let ups = 0;    
let filterStrength = 20; 
let updateTime = 0, thisUpdateTime; 
let lastLoop = new Date, thisLoop; 
// Game exit boolean
let stopGame = false;
// Game loop method
function update() {
    if(stopGame)
        return; 

    // Calculating the nubmer of updates per second
    thisLoop = new Date;
    thisUpdateTime = thisLoop - lastLoop; 
    updateTime += (thisUpdateTime - updateTime) / filterStrength; 
    lastLoop = thisLoop;
    
    ups = (1000/updateTime).toFixed(1);
    upsParagraph.innerText = `UPS: ${ups}`;

    // Clear canvas based on lane size (Will loop through all lanes)
    ctx.clearRect(0, laneCanvas.height - lane_one.height, laneCanvas.width, laneCanvas.height + lane_one.height);
    
    // Lane drawing
    drawLaneBackground(lane_one);
    drawMeasureLines(lane_one);
    updateNotes(lane_one, lane_one.notes, lane_one.note_gap);
    drawHitZone(lane_one);

    // Canvas translation
    translationSpeed = ((lane_one.note_gap * (bpm/60)) / ups)
    translationParagraph.innerText = translationSpeed.toFixed(2);

    if(translationAmount > lane_one.height) {
        translationAmount = 0;
        // ctx.restore();
        // ctx.save(); 
    }

    // ctx.translate(0, translationSpeed);
    translationAmount += translationSpeed;


    // Request next frame
    requestAnimationFrame(update);
}
// #endregion

// #region (Initial setup)
let lane_one = new Lane(3000, bpm, [], 150, 'a');


let startingY = laneCanvas.height - 200;
let measure32ndNote = lane_one.note_gap/8; 
let areaHeight = measure32ndNote/2;
let lane_one_hitzone = new Hitzone(startingY, areaHeight, startingY + areaHeight, areaHeight, startingY + (2*areaHeight), areaHeight);
lane_one.hitzone = lane_one_hitzone;

populateNotes(lane_one);
key_lane_pairs[lane_one.input_key] = lane_one;


// First call to game loop
requestAnimationFrame(update);
// #endregion
