// #region ( Imports )
import Hitzone from "./Hitzone.ts";
import Lane from "./Lane.ts"
import Note from "./Note.ts";
import { resetLaneStats, findSortedIndex } from "./Utils.ts";
import { COLORS, ZONE_NAMES } from "./constants.ts";
import AudioSprite from "./AudioSprite.ts";
import { getLaneEditingHTML } from "./elements.ts";

// #endregion

// ( Midi Access Setup )
if(navigator.requestMIDIAccess) { // Ensures that MIDI access is enabled in the current browser
  navigator.requestMIDIAccess().then(midi_connection_success, midi_connection_failure);
}

// TODO: Will need redo this so that it runs by default. Will need to remove existing event listeners.
function midi_connection_success(midiAccess: MIDIAccess) {
  midiAccess.onstatechange = updateDevices;
  const inputs = midiAccess.inputs;

  inputs.forEach(input => { input.onmidimessage = processMidiMessage;});
}
// TODO: Alert the user in input selection menu of the failure
function midi_connection_failure() { console.log('Failed to connect MIDI device'); }

// MIDI related
// TODO: Dynamically update list of available midi inputs 
function updateDevices(event: Event) { console.log(event); }

function processMidiMessage(input: MIDIMessageEvent) {
    // 153 is on 137 is off
    const inputData = input.data; 
    if(inputData == null)
      return; 

    const command = inputData[0];
    const note = inputData[1];
    const velocity = inputData[2];

    // console.log(command, note, velocity)

    if(velocity > 0) { // See if this is always true
        midiNoteOn(note, velocity)
    } else {
        midiNoteOff(note);
    }
}

// #region ( Global variables )
let laneCount = 0; 
const laneContainer = document.getElementById('lane_container') as HTMLElement | null; 
// const lane_ctx_pairs: { [key: string]: [Lane, CanvasRenderingContext2D | null] } = {};
const input_lane_pairs: { [key: string ]: Lane } = {};
const canvas_lane_pairs: { [key: string ]: Lane } = {};

// const lane_one_canvas = document.getElementById('lane_one_canvas') as HTMLCanvasElement | null;

// if(lane_one_canvas != null) {
//   const context = lane_one_canvas.getContext('2d');
//   if(context)
//     canvas_ctx_pairs[lane_one_canvas.id] = context;


let ups = 0; 
let translationAmount = 0; 

let paused = false; 
let editing = false;
let controlsPinned = false; 

let container_width = laneContainer?.clientWidth;
let container_height = laneContainer?.clientHeight;
let audioSprite: AudioSprite;

// DOM Elements
const upsParagraph = document.getElementById('ups_paragraph') as HTMLElement;
const enableAudioButton = document.getElementById('enable_audio') as HTMLElement;
const runControls = document.getElementById('run_controls');

// Buttons 
const playButton = document.getElementById('play_button');
const pauseButton = document.getElementById('pause_button');
const stopButton = document.getElementById('stop_button');
const editButton = document.getElementById('edit_button')
const addLaneButton = document.getElementById('add_lane_button')
// const lockButton = document.getElementById('lock_button');

// #endregion
function resetLanes() {
  for (let key in input_lane_pairs) {
    let lane = input_lane_pairs[key] as Lane;

    lane.resetLane();
  }
}

function populateTestNotes(lane: Lane) {
  // Creates an 8th note swing pattern
  resetLaneStats(lane);


  let startY = lane.startY;

  // TODO: Temporary
  let multiplier = 1;
  if(lane.hitsound == 'kick') {
    multiplier = .5;
  }
  if(lane.hitsound == 'snare'){
    multiplier = .5;
    startY -= lane.noteGap;
  }
  if(lane.hitsound == 'closed-hihat')
    multiplier = 2;

  for(let y = startY; y > lane.topOfLane; y -= lane.noteGap/multiplier) {
   
    // TODO:???? Ask Sean about this
    // lane.timeSignature[0]: Number of below notes per bar
    // lane.timeSignature[1]: Fractional note, number of these per bar given above
    let height = lane.noteGap/(lane.timeSignature[1] * lane.timeSignature[0])

    if(height < 5)
      height = 5; 

    let newNote = new Note(y);
    lane.notes.push(newNote);
  }
  console.log(lane.notes);
}
function updateLaneWidth(lane: Lane, multiplier: number) {
  if(container_width)
    lane.canvas.width = (container_width / 4) * multiplier;
}

function updateAllLaneWidths() {
  let multiplier = 1; 
  switch(laneCount) {
    case 4:
      multiplier = (0.75);
      break;
    case 5:
      multiplier = (0.6);
      break;
    case 6:
      multiplier = (0.5);
      break;
  }

  // canvases.forEach(canvas => {
  //   if(container_width)
  //     canvas.width = (container_width / 4) * multiplier;
  // });

  for (let key in input_lane_pairs) {
    let lane = input_lane_pairs[key];
    if(container_width)
      lane.canvas.width = (container_width / 4) * multiplier;
  }
}

function createNewLane(        
  bpm: number, 
  measureCount: number, 
  noteGap: number,
  hitsound: string, 
  maxWrongNotes: number,
  notes: Note[],
  timeSignature: number[],
  inputKey: string
) {
  if(!container_width || !container_height) {
    console.error('Container dimensions undefined');
    return;
  }

  if(Object.keys(input_lane_pairs).includes(inputKey)) {
    console.error('Input key already in use');
    return;
  }
  
  const newCanvas = document.createElement('canvas');
  newCanvas.classList.add('lane_canvas');
  newCanvas.id = `canvas_${laneCount}`;

  newCanvas.width = container_width / 4;
  newCanvas.height = container_height;
  
  newCanvas.addEventListener('click', handleCanvasClick);

  const new_lane = new Lane(bpm, measureCount, noteGap, hitsound, maxWrongNotes, notes, timeSignature, inputKey, newCanvas);

  // TODO: Review if these can be unified
  input_lane_pairs[new_lane.inputKey] = new_lane;
  canvas_lane_pairs[newCanvas.id] = new_lane;

  new_lane.drawInputVisual();
  populateTestNotes(new_lane);

  const canvasContainer = document.createElement('div');
  // canvasContainer.style.padding = '0 1em 0 1em';
  canvasContainer.classList.add('canvas_container');
  canvasContainer.appendChild(newCanvas);

  const laneEditingSection = document.createElement('div') as HTMLElement;
  laneEditingSection.innerHTML = getLaneEditingHTML(newCanvas.id, bpm, measureCount, hitsound);
  canvasContainer.appendChild(laneEditingSection);

  if(audioSprite)
    new_lane.audioSprite = audioSprite; 
  
  laneCount++;
  laneContainer?.appendChild(canvasContainer);
  
  document.getElementById(`${newCanvas.id}_bpm_input`)?.addEventListener('change', bpmInputChange);
  document.getElementById(`${newCanvas.id}_measure_count_input`)?.addEventListener('change', measureCountChange);
  document.getElementById(`${newCanvas.id}_time_signature_select`)?.addEventListener('change', timeSignatureChange);
  document.getElementById(`${newCanvas.id}_metronome_button`)?.addEventListener('click', metronomeButtonClick);
  document.getElementById(`${newCanvas.id}_back_to_start`)?.addEventListener('click', backToStartClick);
  document.getElementById(`${newCanvas.id}_close`)?.addEventListener('click', closeClick);
  document.getElementById(`${newCanvas.id}_clear_notes_button`)?.addEventListener('click', clearNotesClick);
  document.getElementById(`${newCanvas.id}_hitsound_select`)?.addEventListener('change', hitsoundSelectChange);
  document.getElementById(`${newCanvas.id}`)?.addEventListener('mousemove', canvasMouseOver);
  document.getElementById(`${newCanvas.id}`)?.addEventListener('wheel', canvaseMouseWheel);
 
  // TODO: Revist this to make it more robust (Put in own function)
  // Dynamically updates lane widths based on the number of lanes
  updateAllLaneWidths();

}

function findLaneFromEvent(event: Event): Lane {
  let target = event.target as HTMLElement;
  let associatedCanvas = target.closest('.canvas_container')?.querySelector('.lane_canvas');
  if(associatedCanvas == null)
    throw new Error('No associated lane found');

  let associatedLane = canvas_lane_pairs[associatedCanvas?.id];
  return associatedLane;
}

function closeClick(event: MouseEvent) {
  offsetY = -10;
  for (let key in input_lane_pairs) {
    let lane = input_lane_pairs[key];
    lane.canvas.classList.remove('editing');
    lane.canvas.parentElement?.classList.remove('background');

    let laneEditingSection = lane.canvas.parentElement?.querySelector('.lane_editing');
    laneEditingSection?.classList.remove('activated')

    resetLanes();
    drawSingleLane(lane);
  }
}

function backToStartClick(event: MouseEvent) {
  let associatedLane = findLaneFromEvent(event);

  associatedLane.translationAmount = 0; 
  drawSingleLane(associatedLane);

}

function hitsoundSelectChange(event: Event) {
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);
  lane.hitsound = target.value; 
}

function clearNotesClick(event: MouseEvent) {
  let lane = findLaneFromEvent(event);
  lane.notes = [];
  drawSingleLane(lane);
}

function bpmInputChange(event: Event) {
  let target = event.target as HTMLInputElement;
  let newBPM = target.value; 
  
  findLaneFromEvent(event).bpm = parseInt(newBPM); 

 
  console.log(target.value);
}

function measureCountChange(event: Event) {
  let target = event.target as HTMLInputElement;
  let newMC = target.value; 
  
  let lane = findLaneFromEvent(event);
  lane.measureCount = parseInt(newMC);
  
  // TODO: Add ability to keep notes before measure cut off
  lane.notes = [];
  lane.recalculateHeight();

  drawSingleLane(lane);
 
  console.log(target.value);
}

function timeSignatureChange(event: Event) {
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);

  let split = target.value.split('/');
  lane.timeSignature = [parseInt(split[0]), parseInt(split[1])];

  lane.notes = [];
  lane.recalculateHeight();
  drawSingleLane(lane);

}

function metronomeButtonClick(event: MouseEvent) {
  let associatedLane = findLaneFromEvent(event);
  associatedLane.metronomeEnabled = !associatedLane.metronomeEnabled;
  console.log(associatedLane);
  let metronomeParagraph = document.getElementById(`${associatedLane.canvas.id}_metronome_paragraph`);
  if(metronomeParagraph)
    metronomeParagraph.innerText = `Metronome ${associatedLane.metronomeEnabled ? 'enabled' : 'disabled'}`;
}




// Have a max number of measures. 
// For this prototype max number of lanes will be 4. Further optimisation will be needed for more. turns out it was the shadows.
createNewLane(100, 200, 200, 'kick', 3, [], [4, 4], '40');
createNewLane(100, 200, 200, 'snare', 3, [], [4, 4], '41');
createNewLane(100, 200, 200, 'closed-hihat', 3, [], [4, 4], '42');
// createNewLane(100, 2000, 200, 'kick', 3, [], [4, 4], 'd'); 
// createNewLane(100, 2000, 200, 'kick', 3, [], [4, 4], 'a');
// createNewLane(100, 2000, 200, 'kick', 3, [], [4, 4], 's');
// createNewLane(100, 2000, 200, 'kick', 3, [], [4, 4], 'd');
// createNewLane(100, 2000, 200, 'kick', 3, [], [4, 4], 'f');
// createNewLane();
// createNewLane();
// createNewLane();
// createNewLane();
// createNewLane();
// console.log(lane_ctx_pairs);

// TODO: Move this?
// #region ( Event listeners )

window.addEventListener('resize', () => {
  // TODO: Dynamically resize lanes
});

function midiNoteOn(note: number, velocity: number) {
  let associatedLane = input_lane_pairs[note.toString()];
  if(associatedLane != null)
    associatedLane.handleInputOn(paused); 
}

function midiNoteOff(note: number) {
  let associatedLane = input_lane_pairs[note.toString()];
  if(associatedLane != null)
    associatedLane.handleInputOff(); 
}

const keyHeld: { [key: string]: boolean } = {};
window.addEventListener('keydown', (event) => {
  if(keyHeld[event.key] == true)
    return;

  let associatedLane = input_lane_pairs[event.key];
  if(associatedLane != null)
    associatedLane.handleInputOn(paused); 

  keyHeld[event.key] = true
})

window.addEventListener('keyup', (event) => {
  let associatedLane = input_lane_pairs[event.key];
  if(associatedLane != null)
    associatedLane.handleInputOff(); 

  keyHeld[event.key] = false
})

enableAudioButton.addEventListener('click', () => {
  if(audioSprite) 
    return;

  audioSprite = new AudioSprite({
    "src": [
      "../public/drums.mp3"
    ],
    "sprite": {
      "clap": [
        0,
        734.2630385487529
      ],
      "closed-hihat": [
        2000,
        445.94104308390035
      ],
      "crash": [
        4000,
        1978.6848072562354
      ],
      "kick": [
        7000,
        553.0839002267571
      ],
      "open-hihat": [
        9000,
        962.7664399092968
      ],
      "snare": [
        11000,
        354.48979591836684
      ]
    }
  });

  for (let key in input_lane_pairs) {
    let lane = input_lane_pairs[key];
    lane.audioSprite = audioSprite;
  }
});


// TODO: Come back to this
// let mouseOverTime;
// runControls?.addEventListener('mouseover', () => {
//   console.log('mouse over')
//   runControls.classList.add('expanded')

//   mouseOverTime = performance.now();
// });
// runControls?.addEventListener('mouseout', (event) => {
    
//   const target = event.relatedTarget as HTMLElement;
//   if(!target || !runControls.contains(target)) {
//     runControls.classList.remove('expanded')
//     console.log('mouse out')

//   }

// });
const newLaneInput = document.getElementById('new_lane_input') as HTMLInputElement;

addLaneButton?.addEventListener('click', () => {
  let input = newLaneInput.value;
  console.log(laneCount);
  if(!input || laneCount >= 6)
    return;

  paused = true; 
  createNewLane(80, 2, 200, 'kick', 3, [], [4, 4], input);
  resetLanes();
  drawLanes();
  
});

playButton?.addEventListener('click', () => { 
  // TODO: Look into single lane playing while in edit mode
  if(editing)
    return;
  
  paused = false; 

  playButton.classList.add('selected');
  pauseButton?.classList.remove('selected');
  stopButton?.classList.remove('selected');
  editButton?.classList.remove('selected');
});

pauseButton?.addEventListener('click', () => { 
  // TODO: Look into single lane playing while in edit mode
  if(editing)
    return;

  paused = true 

  pauseButton.classList.add('selected');
  playButton?.classList.remove('selected');
  stopButton?.classList.remove('selected');
  editButton?.classList.remove('selected');
});

stopButton?.addEventListener('click', () => {
  // TODO: Look into single lane playing while in edit mode
  if(editing)
    return;
  
  paused = true 

  resetLanes();
  // TODO: Put this in own function
  for (let key in input_lane_pairs) {
    let lane = input_lane_pairs[key];
    lane.ctx.clearRect(0, 0, lane.canvas.width, lane.canvas.height - lane.inputAreaHeight);

    lane.drawHitzone();
    lane.drawMeasureIndicators();
    lane.updateNotes(ups, 0);
    lane.drawInputVisual();
  }

  stopButton.classList.add('selected');
  playButton?.classList.remove('selected');
  pauseButton?.classList.remove('selected');
  editButton?.classList.remove('selected');
  // TODO: reset run
});

editButton?.addEventListener('click', () => {
  paused = true;
  editing = !editing;

  
  resetLanes();
  // TODO: Put this in own function
  for (let key in input_lane_pairs) {
    let lane = input_lane_pairs[key];
    lane.ctx.clearRect(0, 0, lane.canvas.width, lane.canvas.height - lane.inputAreaHeight);

    lane.drawHitzone();
    lane.drawMeasureIndicators();
    lane.updateNotes(ups, 0);
    lane.drawInputVisual();
  }

  if(editing) {
    editButton.classList.add('selected');
    playButton?.classList.remove('selected');
    pauseButton?.classList.remove('selected');
    stopButton?.classList.remove('selected');

    laneContainer?.classList.add('editing');
  } else {
    editButton.classList.remove('selected');
    laneContainer?.classList.remove('editing');

    for (let key in input_lane_pairs) {
      let lane = input_lane_pairs[key];
      lane.canvas.classList.remove('editing');
      lane.canvas.parentElement?.classList.remove('background');

      let laneEditingSection = lane.canvas.parentElement?.querySelector('.lane_editing');
      laneEditingSection?.classList.remove('activated')
    }
    // TODO: Dynamic
    resetLanes();
    updateAllLaneWidths();
    drawLanes();
  }
});

function canvaseMouseWheel(event: WheelEvent) {
  let canvas = event.target as HTMLCanvasElement;
  if(!editing || !canvas.classList.contains('editing'))
    return; 

  console.log(findLaneFromEvent(event));
  let lane = findLaneFromEvent(event);

  // TODO: Clean this up
  if(lane.translationAmount - event.deltaY/2.5 > 0)
    lane.translationAmount -= event.deltaY/2.5; 

  // TODO: Put this in own function 
  drawSingleLane(lane);


  if(event.deltaY > 0) {
      console.log('scroll down in edit mode');    
  } else {
      console.log('scroll up in edit mode');
  }
}


let offsetY = 0; 
function canvasMouseOver(event: MouseEvent) {
  let canvas = event.target as HTMLCanvasElement;
  if(!editing || !canvas.classList.contains('editing'))
    return; 

  offsetY = event.offsetY;
  
  let lane = findLaneFromEvent(event);
  drawSingleLane(lane);
  // console.log(event.offsetX, event.offsetY, canvas.id);
}

document.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  let target = event.target as HTMLElement; 

  if(!target.classList.contains('lane_canvas'))
    return;
  
  let lane = findLaneFromEvent(event); 
  if(lane)
    handleCanvasClick(event); 
})

function handleCanvasClick(event: MouseEvent) {
  if(!editing)
    return; 

  let canvas = event.target as HTMLElement; 

  if(canvas.classList.contains('editing')) {
    // click while in edit mote     
    // console.log(event.offsetX, event.offsetY, newNoteY);
    let lane = findLaneFromEvent(event); 
    let sortedIndex = findSortedIndex(lane.notes, newNoteY);
    console.log(sortedIndex);

    if(sortedIndex[1] == 1) {
      if(event.button == 2) {
        lane.notes.splice(sortedIndex[0], 1);
        drawSingleLane(lane); 

      }
      return;
    } else if(event.button != 2) {
      let newNote = new Note(newNoteY);
      lane.notes.splice(sortedIndex[0], 0, newNote)
      drawSingleLane(lane); 
    }


    return;
  }

  
  // click to send canvas to edit mode
  canvas.classList.add('editing');
  canvas.parentElement?.classList.remove('background');
  console.log(canvas.parentElement);

  let laneEditingSection = canvas.parentElement?.querySelector('.lane_editing');
  laneEditingSection?.classList.add('activated')

  for (let key in input_lane_pairs) {
    let lane = input_lane_pairs[key];
    if(lane.canvas != canvas) {
      lane.canvas.classList.remove('editing');
      lane.canvas.parentElement?.classList.add('background');
    } else {
      updateLaneWidth(lane, 1); 
      resetLanes();

      drawSingleLane(lane);
    }
  }
}

// TODO: Come back to this
// lockButton?.addEventListener('click', () => { 
//   controlsPinned = !controlsPinned; 
//   if(controlsPinned && runControls)
//     runControls.classList.add('pinned')
//   else if(runControls)
//     runControls.classList.remove('pinned')
// });

// window.addEventListener('focus', () => {});
// window.addEventListener('blur', () => {paused = true});
// #endregion


// #region ( Initial setup ) 
// let lane_one_hitzone = new Hitzone(10, 10, 10, 10, 10, 10); 
// let lane_one = new Lane(bpm, 10, 150, lane_one_hitzone, 'kick', 3, [], [4, 4]);
// #endregion

// TODO: Reword this and rework it too, split it into seperate functions
let newNoteY = -1; 
function drawSingleLane(lane: Lane) {
  lane.ctx.clearRect(0, 0, lane.canvas.width, lane.canvas.height - lane.inputAreaHeight);
  lane.drawHitzone();
  lane.drawMeasureIndicators();
  lane.updateNotes(ups, 0);
  lane.drawInputVisual();

  if(editing) {
    let divider = 16/lane.timeSignature[0];
    let height = lane.noteGap/divider;
    let drawHeight = lane.noteGap/(lane.timeSignature[1] * lane.timeSignature[0])


    let oddLoop = false;
    for(let y = lane.startY; y > lane.topOfLane; y -= height) {
      let effectiveY = y + lane.translationAmount; 
      if(effectiveY > lane.canvas.height)
        continue; 

      if(effectiveY < -lane.noteGap)
        break;

      lane.ctx.fillStyle = COLORS.NOTE_AREA_HIGHLIGHT;
      lane.ctx.beginPath();
      lane.ctx.roundRect(30, effectiveY - (drawHeight/2), lane.canvas.width - 60, drawHeight, 20); 
      lane.ctx.fill();

      // if(oddLoop) {
      //   lane.ctx.fillStyle = COLORS.NOTE_AREA_HIGHLIGHT;
      //   lane.ctx.beginPath();
      //   lane.ctx.roundRect(30, effectiveY - (height/2), lane.canvas.width - 60, height, 20); 
      //   lane.ctx.fill();

      //   oddLoop = !oddLoop        
      // } else {
      //   oddLoop = !oddLoop
      // }

      let effectiveOffsetY = offsetY - translationAmount;
      if(effectiveOffsetY > (effectiveY - (height/2)) && effectiveOffsetY <= (effectiveY - (height/2)) + height) {
        newNoteY = y; 
        // console.log(newNoteY);
        // console.log(lane.notes);
        let width = lane.canvas.width/2; 
        let x = (width) - (width/2);

        lane.ctx.fillStyle = COLORS.HIGHLIGHTED_NOTE_FILL;
        lane.ctx.beginPath();
        lane.ctx.roundRect(x, effectiveY - (drawHeight/2), width, drawHeight, 20); 
        lane.ctx.fill();
      }
    }
  }
}

function drawLanes() {
  for (let key in input_lane_pairs) {
    let lane = input_lane_pairs[key];

    lane.drawHitzone();
    lane.drawMeasureIndicators();
    lane.updateNotes(ups, 0);
    lane.drawInputVisual();
  }
}

// #region ( Main game loop )
let lastLoop = performance.now();
let updateTime = 0; 
let filterStrength = 20; 
// TODO: Pause updating when the window is out of focus. 
function gameLoop(timeStamp: number) {

  // Calculating the number of updates per second
  // Relevant for determining the time it will take for notes to reach the hitzone 
  let interval = timeStamp - lastLoop; 
  updateTime += (interval - updateTime) / filterStrength; 
  ups = (1000/updateTime); 
  upsParagraph.innerText = ups.toString().substring(0, 6); 
  lastLoop = timeStamp;
  
  for (let key in input_lane_pairs) {
    // TODO: Review if this is the best way
    let lane = input_lane_pairs[key];

    if(paused) {
      lane.drawInputVisual(); // So that when paused an in edit mode you can verify that your input mode works
      continue;
    }
    
    // Determining the speed of translation for each lane based on the current loop interval
    let translationSpeed = (interval / (60000/lane.bpm)) * lane.noteGap;
    lane.translationAmount += translationSpeed;
    
    // TODO: Need a much more robust way of looping
    if(lane.translationAmount > (lane.canvas.height - lane.startY) + lane.height) {
      lane.resetLane();
    }
    
    
    lane.ctx.clearRect(0, 0, lane.canvas.width, lane.canvas.height - lane.inputAreaHeight);
    lane.drawHitzone();
    lane.drawMeasureIndicators();
    lane.updateNotes(ups, translationSpeed);
    lane.drawInputVisual();
  }


  window.requestAnimationFrame(gameLoop);
}
window.requestAnimationFrame(gameLoop);
// #endregion

