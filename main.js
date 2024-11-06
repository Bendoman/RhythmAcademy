// ( Canvas Setup )
let laneCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById('lane1_canvas'));
let ctx = /** @type {CanvasRenderingContext2D} */ laneCanvas.getContext("2d");
// For when multiple lanes are added
// let canvas_contexts = {};

const contentContainer = document.getElementById('content');

let width = contentContainer.clientWidth;
let height = contentContainer.clientHeight;

laneCanvas.width = width / 6;
laneCanvas.height = height * 0.85;


// #region (Global variables)
let bpm = 120;
let translationSpeed = 0.6;
let translationAmount = 0; 
let hitzone_start_y = laneCanvas.height - 50;

// DOM Elements
// Inputs
const bpmInput = document.getElementById('BPM_input');

// Debug displays
const upsParagraph = document.getElementById('ups_pagraph');
const translationParagraph = document.getElementById('translation_pagraph');

// #endregion


// #region (Objects) 
function Lane(height, bpm, notes, note_gap, input_key) {
    this.height = height; 
    this.bpm = bpm; 
    this.notes = notes; 
    this.note_gap = note_gap; // Defines the distance between full notes
    this.input_key = input_key;
    this.handleInput = () => { handleLaneInput(this) };
}

// Associates an input key with a given lane
// Keydown event listener will only check for keys in this object
let key_lane_pairs = {};
// #endregion 


// #region (Event listeners)
// 
// Input fields
// Fetching BPM from input 
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
// #endregion

// #region (Util functions)
function handleLaneInput(lane) {
    console.log(lane);
}

// For testing purposes, will be replaced.
// Populates lane with as many full notes as will fit within its assigned height
function populateNotes(lane) {
    lane.notes.push('test');
    for(let y = hitzone_start_y - lane.note_gap; y > laneCanvas.height - lane.height; y -= lane.note_gap) {
        console.log(y);
        lane.notes.push({x:laneCanvas.width/2 - laneCanvas.width/4, y:y, width:laneCanvas.width/2, height:lane.note_gap/8}) // Height should be lane.note_gap/8
    }
}

function drawNotes(notes, note_gap) {
    for(let n = 0; n < notes.length; n++) {
        let note = notes[n];
        ctx.fillStyle = 'black';
        if(n % 8 == 0)
            ctx.fillStyle = 'red';
        ctx.fillRect(note.x, note.y-1.5, note.width, note.height);

        let disanceToHitzone = ((hitzone_start_y - translationAmount - 50) - note.y)
        let secondsToHitzone = Math.ceil(((disanceToHitzone/translationSpeed)/ups).toFixed(2));
        ctx.fillStyle = 'white';
        ctx.font = "12px sans-serif"
        ctx.fillText(`${secondsToHitzone}s to zone`, note.x + 30, note.y - 2)
    }
}

// Temporary for testing. Needs to be solidified.
function drawMeasureLines(lane) {
    let barCount = 1; // Only considering 4/4 time signature for now
    for(let y = hitzone_start_y - lane.note_gap; y > laneCanvas.height - lane.height; y -= lane.note_gap) {
        // console.log(y);
        // lane.notes.push({x:0, y:y, width:laneCanvas.width, height:lane.note_gap/8})
        ctx.fillStyle = 'white';
        ctx.fillRect(15, y, laneCanvas.width, 1);

        if(barCount == 1) {
            ctx.font = "20px sans-serif"
            ctx.fillText(barCount, 2, y + 4)
        } else {
            ctx.font = "10px sans-serif"
            ctx.fillText(barCount, 5, y + 4)
        }

        barCount++;
        if(barCount > 4)
            barCount = 1;
    }
}

function drawHitZone() {
    ctx.fillStyle = 'rgba(50, 255, 50, .5)'
    ctx.fillRect(0, hitzone_start_y - translationAmount - 50, laneCanvas.width, 25);
}

function drawLaneBackground(lane) {
    ctx.fillStyle = 'teal';
    ctx.fillRect(0, laneCanvas.height - lane.height, laneCanvas.width, lane.height);
}

// #endregion


// #region (Initial setup)
let lane_one = new Lane(5000, bpm, [], 50, 'a');
populateNotes(lane_one);
key_lane_pairs[lane_one.input_key] = lane_one;


// So that translation can be reverted if necessary
ctx.save();
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
    drawNotes(lane_one.notes, lane_one.note_gap);
    drawHitZone();

    // Canvas translation
    translationSpeed = ((lane_one.note_gap * (bpm/60)) / ups)
    translationParagraph.innerText = translationSpeed.toFixed(2);

    if(translationAmount > lane_one.height) {
        translationAmount = 0;
        ctx.restore();
        ctx.save(); 
    }

    ctx.translate(0, translationSpeed);
    translationAmount += translationSpeed;


    // Request next frame
    requestAnimationFrame(update);
}
// First call to game loop
requestAnimationFrame(update);
// #endregion
