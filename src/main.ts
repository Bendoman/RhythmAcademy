// #region ( Imports )
import Hitzone from "./Hitzone.ts";
import Lane from "./Lane.ts"
import Note from "./Note.ts";
import { resetLaneStats } from "./Utils.ts";
// #endregion

// #region ( Global variables )
let laneCount = 0; 
let canvases: HTMLCanvasElement[] = [];
const laneContainer = document.getElementById('lane_container') as HTMLElement | null; 
// const lane_ctx_pairs: { [key: string]: [Lane, CanvasRenderingContext2D | null] } = {};
const input_lane_pairs: { [key: string ]: Lane } = {};

// const lane_one_canvas = document.getElementById('lane_one_canvas') as HTMLCanvasElement | null;

// if(lane_one_canvas != null) {
//   const context = lane_one_canvas.getContext('2d');
//   if(context)
//     canvas_ctx_pairs[lane_one_canvas.id] = context;


let bpm = 120; 

let container_width = laneContainer?.clientWidth;
let container_height = laneContainer?.clientHeight;


// #endregion


function populateTestNotes(lane: Lane) {
  resetLaneStats(lane);
  for(let y = lane.startY; y > lane.topOfLane; y -= lane.noteGap) {
    // TODO: Change lane.notegap/8
    let height = lane.noteGap/16
    if(height < 5)
      height = 5; 

    let newNote = new Note(lane.canvasWidth/2 - lane.canvasWidth/4, y, lane.canvasWidth/2, height);
    lane.notes.push(newNote);
  }
  console.log(lane);
}

function updateLaneWidths(multiplier: number) {
  canvases.forEach(canvas => {
    if(container_width)
      canvas.width = (container_width / 4) * multiplier;
  });
}

function createNewLane() {
  if(!container_width || !container_height) {
    console.error('Container dimensions undefined');
    return;
  }
  
  const newCanvas = document.createElement('canvas');
  newCanvas.classList.add('lane_canvas');
  newCanvas.id = `canvas_${laneCount}`;

  newCanvas.width = container_width / 4;
  newCanvas.height = container_height;

  let ctx = newCanvas.getContext('2d');
  if(ctx != null) {
    const new_lane = new Lane(bpm, 10, 150, 'kick', 3, [], [4, 4], newCanvas.width, newCanvas.height, 'a', ctx);
    input_lane_pairs[new_lane.inputKey] = new_lane;

    new_lane.drawHitzone(newCanvas.width);
    new_lane.drawMeasureIndicators(0);

    populateTestNotes(new_lane);
    new_lane.drawNotes(0);

    new_lane.drawInputVisualUnpressed();
  }

  laneCount++;
  canvases.push(newCanvas);
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

createNewLane();
// createNewLane();
// createNewLane();
// createNewLane();
// createNewLane();
// createNewLane();
// console.log(lane_ctx_pairs);
console.log(canvases);


// #region ( Event listeners )

window.addEventListener('resize', () => {
  // TODO: Dynamically resize lanes
});

// TODO: Make this specific to key event
let keyHeld = false;
window.addEventListener('keydown', (event) => {
  if(keyHeld)
    return;

  let associatedLane = input_lane_pairs[event.key];
  if(associatedLane != null)
    associatedLane.handleInputOn(); 

  // TODO: Make this specific to key event
  keyHeld = true; 
})

window.addEventListener('keyup', (event) => {
  let associatedLane = input_lane_pairs[event.key];
  if(associatedLane != null)
    associatedLane.handleInputOff(); 

  // TODO: Make this specific to key event
  keyHeld = false; 
})

// #endregion


// #region ( Initial setup ) 
// let lane_one_hitzone = new Hitzone(10, 10, 10, 10, 10, 10); 
// let lane_one = new Lane(bpm, 10, 150, lane_one_hitzone, 'kick', 3, [], [4, 4]);
// #endregion


// #region ( Main game loop )

// #endregion
