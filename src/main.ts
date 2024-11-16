// #region ( Imports )
import Hitzone from "./Hitzone.ts";
import Lane from "./Lane.ts"
import Note from "./Note.ts";
import { resetLaneStats } from "./Utils.ts";
import { ZONE_NAMES } from "./constants.ts";
import AudioSprite from "./AudioSprite.ts";

// #endregion

// #region ( Global variables )
let laneCount = 0; 
const laneContainer = document.getElementById('lane_container') as HTMLElement | null; 
// const lane_ctx_pairs: { [key: string]: [Lane, CanvasRenderingContext2D | null] } = {};
const input_lane_pairs: { [key: string ]: Lane } = {};

// const lane_one_canvas = document.getElementById('lane_one_canvas') as HTMLCanvasElement | null;

// if(lane_one_canvas != null) {
//   const context = lane_one_canvas.getContext('2d');
//   if(context)
//     canvas_ctx_pairs[lane_one_canvas.id] = context;


let ups = 0; 
let translationAmount = 0; 
let inEditMode = false; 

let container_width = laneContainer?.clientWidth;
let container_height = laneContainer?.clientHeight;
let audioSprite: AudioSprite;

// DOM Elements
const upsParagraph = document.getElementById('ups_paragraph') as HTMLElement;
const enableAudioButton = document.getElementById('enable_audio') as HTMLElement;

// #endregion


function populateTestNotes(lane: Lane) {
  resetLaneStats(lane);
  // TODO: Temporary
  let multiplier = 1;
  if(lane.hitsound == 'kick')
    multiplier = 2;
  if(lane.hitsound == 'clap')
    multiplier = .5;

  for(let y = lane.startY; y > lane.topOfLane; y -= lane.noteGap/multiplier) {
   
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

function updateLaneWidths(multiplier: number) {
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
  hitsound: String, 
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

  const new_lane = new Lane(bpm, measureCount, noteGap, hitsound, maxWrongNotes, notes, timeSignature, inputKey, newCanvas);

  input_lane_pairs[new_lane.inputKey] = new_lane;

  new_lane.drawInputVisual();
  populateTestNotes(new_lane);

  laneCount++;
  laneContainer?.appendChild(newCanvas);
  // TODO: Revist this to make it more robust
  // Dynamically updates lane widths based on the number of lanes
  switch(laneCount) {
    case 4:
      updateLaneWidths(0.75);
      break;
    case 5:
      updateLaneWidths(0.6);
      break;
    case 6:
      updateLaneWidths(0.5);
      break;
  }
}

// Have a max number of measures. 
// For this prototype max number of lanes will be 4. Further optimisation will be needed for more. turns out it was the shadows.
createNewLane(60, 3000, 200, 'kick', 3, [], [4, 4], 'q');
createNewLane(60, 3000, 200, 'snare', 3, [], [4, 4], 'w');
createNewLane(60, 2000, 200, 'clap', 3, [], [4, 4], 'e');
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


// #region ( Event listeners )

window.addEventListener('resize', () => {
  // TODO: Dynamically resize lanes
});

const keyHeld: { [key: string]: boolean } = {};
window.addEventListener('keydown', (event) => {
  if(keyHeld[event.key] == true)
    return;

  let associatedLane = input_lane_pairs[event.key];
  if(associatedLane != null)
    associatedLane.handleInputOn(); 

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

// #endregion


// #region ( Initial setup ) 
// let lane_one_hitzone = new Hitzone(10, 10, 10, 10, 10, 10); 
// let lane_one = new Lane(bpm, 10, 150, lane_one_hitzone, 'kick', 3, [], [4, 4]);
// #endregion


// #region ( Main game loop )
let lastLoop = performance.now();
let updateTime = 0; 
let filterStrength = 20; 
function gameLoop(timeStamp: number) {

  // Calculating the number of updates per second
  // Relevant for determining the time it will take for notes to reach the hitzone 
  let interval = timeStamp - lastLoop; 
  updateTime += (interval - updateTime) / filterStrength; 
  ups = (1000/updateTime); 
  upsParagraph.innerText = ups.toString().substring(0, 6); 
  lastLoop = timeStamp;

  
   for (let key in input_lane_pairs) {
    let lane = input_lane_pairs[key];
    lane.ctx.clearRect(0, 0, lane.canvas.width, lane.canvas.height - lane.inputAreaHeight);
    // Determining the speed of translation for each lane based on the current loop interval
    let translationSpeed = (interval / (60000/lane.bpm)) * lane.noteGap;
    lane.translationAmount += translationSpeed;
    
    // TODO: Need a much more robust way of looping
    if(lane.translationAmount > (lane.canvas.height - lane.startY) + lane.height) {
      lane.translationAmount = 0; 
      lane.nextNoteIndex = 0;
    }


    lane.drawHitzone();
    lane.drawMeasureIndicators();
    lane.updateNotes(ups, translationSpeed);
    lane.drawInputVisual();
  }


  window.requestAnimationFrame(gameLoop);
}
window.requestAnimationFrame(gameLoop);
// #endregion
