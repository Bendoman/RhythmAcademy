// #region ( Imports )
import Hitzone from "./Hitzone.ts";
import Lane from "./Lane.ts"
import Note from "./Note.ts";
// #endregion

// #region ( Global variables )
let laneCount = 0; 
let canvases: HTMLCanvasElement[] = [];
const laneContainer = document.getElementById('lane_container') as HTMLElement | null; 
const lane_ctx_pairs: { [key: string]: [Lane, CanvasRenderingContext2D | null] } = {};

// const lane_one_canvas = document.getElementById('lane_one_canvas') as HTMLCanvasElement | null;

// if(lane_one_canvas != null) {
//   const context = lane_one_canvas.getContext('2d');
//   if(context)
//     canvas_ctx_pairs[lane_one_canvas.id] = context;


let bpm = 120; 

let container_width = laneContainer?.clientWidth;
let container_height = laneContainer?.clientHeight;


// #endregion
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

  const new_lane = new Lane(bpm, 10, 250, 'kick', 3, [], [4, 4], newCanvas.height);
  
  lane_ctx_pairs[newCanvas.id] = [new_lane, newCanvas.getContext('2d')];
  // console.log(newCanvas);
  // lane_ctx_pairs[newCanvas.id][1]?.fillRect(0, newCanvas.height - (newCanvas.height * 0.36), newCanvas.width, 2); 

  let ctx = lane_ctx_pairs[newCanvas.id][1];
  if(ctx != null)
    new_lane.drawHitzone(ctx, newCanvas.width);


  laneCount++;
  canvases.push(newCanvas);
  laneContainer?.appendChild(newCanvas);

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

// createNewLane();
createNewLane();
// createNewLane();
// createNewLane();
// createNewLane();
// createNewLane();
console.log(lane_ctx_pairs);
console.log(canvases);


// #region ( Event listeners )

window.addEventListener('resize', () => {
  // TODO: Dynamically resize lanes
});
// #endregion


// #region ( Initial setup ) 
// let lane_one_hitzone = new Hitzone(10, 10, 10, 10, 10, 10); 
// let lane_one = new Lane(bpm, 10, 150, lane_one_hitzone, 'kick', 3, [], [4, 4]);
// #endregion


// #region ( Main game loop )

// #endregion
