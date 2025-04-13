// #region ( Imports )
import Lane from "./Lane.ts"
import Note from "./Note.ts";
import AudioSprite from "./AudioSprite.ts";

import { StatsObject } from "./types.ts";
import { findSortedIndex, saveToLocalStorage } from "./Utils.ts";
import { COLORS, EDIT_MODES } from "./constants.ts";
import { getPatternOptionHTML } from "./elements.ts";
import { retrieveBucketList } from "./SupaUtils.ts";
// #endregion

// #region ( Global variables )
export let lanes: Lane[] = []; 
export let longest_lane: Lane; 
// Associates an inputkey string with the index of its associated lane within the lanes list
const input_lane_pairs: { [key: string ]: number } = {}; 
// Associates a canvas' ID with its lane
const canvas_lane_pairs: { [key: string ]: Lane } = {};

let laneCount = 0; 
let looping = false; 
export let maxMeasureCount = 400; 
export let measureHeight = 800;
export let startY = 800; 

export let global_volume = 1; 
export function setGlobalVolume(newVolume: number) {
  global_volume = newVolume; 
}


let ups = 0; 
let translationAmount = 0; 
export let currentTime = 0; 

let paused = true; 
let editing = false;
let editMode: EditMode = EDIT_MODES.NOTE_MODE;

let audioSprite: AudioSprite;

let laneContainer: HTMLElement | null;
let container_width:number | undefined;
let container_height:number | undefined;

// Pattern creation 
let newPatternMeasures = 1; 
export let patternInCreationNotes: Note[] = []; 
export let patternInCreationPositions: number[] = []; 

export function resetPatternInCreation() {
  patternInCreationNotes = [];
  patternInCreationPositions = [];
}

// DOM Elements
// let upsParagraph: HTMLElement | null;
// #endregion

export function handleMIDIMessage(input: MIDIMessageEvent) {
  const inputData = input.data; 
  if(inputData == null)
    return; 

  const note = inputData[1];
  const velocity = inputData[2];
  console.log(note);

  if(velocity > 0) {
    midiNoteOn(note);
  } else { 
    // If velocity == 0 then it is an indication that the note has been released
    midiNoteOff(note);
  }
}

// TODO: Move all of these somewhere more appropriate
function initalizeListeners() {    
    window.addEventListener('keydown', (event) => {
        if(keyHeld[event.key] == true)
          return;

        // So that control + x keyboard shortcuts do not activate lanes
        if(keyHeld['Control'] == true) 
          return; 

        if(editing && event.key == "Escape") {
          saveCurrentSessionLocally();
          resetLanesEditingStatus();
          return; 
        }


        let associatedLane = lanes[input_lane_pairs[event.key.toUpperCase()]];
        if(associatedLane != null)
          associatedLane.handleInputOn(paused); 
      
        keyHeld[event.key] = true
    
    })

    window.addEventListener('keyup', (event) => {
        let associatedLane = lanes[input_lane_pairs[event.key.toUpperCase()]];
        if(associatedLane != null)
          associatedLane.handleInputOff(); 
      
        keyHeld[event.key] = false
    })

    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        let target = event.target as HTMLElement; 
      
        if(!target.classList.contains('lane_canvas'))
          return;
        
        let lane = findLaneFromEvent(event); 
        if(lane)
          handleCanvasClick(event); 
      })

    window.addEventListener('resize', () => { updateAllLaneSizes(); });

    laneContainer = document.getElementById('lane_container') as HTMLElement | null; 
    container_width = laneContainer?.clientWidth;
    container_height = laneContainer?.clientHeight;
}


function resetLanes(overshoot?: number) {
    lanes.forEach(lane => {
      if(overshoot)
        lane.resetLane(overshoot);
      else
        lane.resetLane();
    })
}

function updateLaneWidth(lane: Lane, multiplier: number) {
  if(laneContainer)
    lane.canvas.width = (laneContainer.clientWidth / 4) * multiplier;
}

export function updateAllLaneSizes() {
  // TODO: Change this to be more dynamic
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
  
  lanes.forEach(lane => {
    // TODO: Include this part in the handleResize method too
    if(laneContainer) {
      lane.canvas.width = (laneContainer.clientWidth / 4) * multiplier;
      lane.canvas.height = laneContainer.clientHeight;
    } else {
      console.error('Lane container undefined');
    }
    lane.handleResize();
    drawSingleLane(lane)
  });
}




function createNewLane(        
  bpm: number, 
  measureCount: number, 
  noteGap: number,
  hitsound: string, 
  maxWrongNotes: number,
  notes: Note[],
  timeSignature: number[],
  inputKey: string,
  hitPrecision: number
) {
    // console.log("in here");
  if(!container_width || !container_height) {
    console.error('Container dimensions undefined');
    return;
  }

  if(Object.keys(input_lane_pairs).includes(inputKey) && inputKey != '(?)') {
    console.error('Input key already in use');
    return;
  }

  // Ensuring that lane doesn't have more measures than workspace
  if(measureCount > maxMeasureCount)
    measureCount = maxMeasureCount;
  
  const newCanvas = document.createElement('canvas');
  newCanvas.classList.add('lane_canvas');
  newCanvas.id = `canvas_${laneCount}`;

  newCanvas.width = container_width / 4;
  newCanvas.height = container_height;
  
  newCanvas.addEventListener('click', handleCanvasClick);

  const new_lane = new Lane(bpm, measureCount, noteGap, hitsound, maxWrongNotes, notes, timeSignature, inputKey.toUpperCase(), newCanvas, hitPrecision);

  // TODO: Review if these can be unified
  lanes.push(new_lane); 
  // console.log(`Adding new lane: to lanes`); 
  // console.log(new_lane)
  input_lane_pairs[new_lane.inputKey.toUpperCase()] = lanes.length - 1;
  canvas_lane_pairs[newCanvas.id] = new_lane;

  new_lane.drawInputVisual();
  // populateTestNotes(new_lane);

  const canvasContainer = document.createElement('div');
  canvasContainer.classList.add('canvas_container');
  canvasContainer.appendChild(newCanvas);

  const laneEditingSection = document.createElement('div') as HTMLElement;
  laneEditingSection.classList.add('lane_editing_section');
  // laneEditingSection.innerHTML = getLaneEditingHTML(newCanvas.id, bpm, measureCount, hitsound, "metronome1", '1/16', maxMeasureCount);
  canvasContainer.appendChild(laneEditingSection);

  if(audioSprite)
    new_lane.audioSprite = audioSprite; 
  
  laneCount++;
  laneContainer?.appendChild(canvasContainer);

  document.getElementById(`${newCanvas.id}`)?.addEventListener('mousemove', canvasMouseOver);
  document.getElementById(`${newCanvas.id}`)?.addEventListener('mouseout', canvasMouseOut);
  document.getElementById(`${newCanvas.id}`)?.addEventListener('wheel', canvasMouseWheel);


  // Dynamically updates lane widths based on the number of lanes
  updateAllLaneSizes();

  if(!longest_lane) {
    longest_lane = new_lane; 
  } else {
    setLongestLane(); 
  }

  return canvasContainer; 
}

function findLaneFromEvent(event: Event): Lane {
  let target = event.target as HTMLElement;
  let associatedCanvas = target.closest('.canvas_container')?.querySelector('.lane_canvas');
  if(associatedCanvas == null)
    throw new Error('No associated lane found');

  let associatedLane = canvas_lane_pairs[associatedCanvas?.id];
  return associatedLane;
}


export function resetLanesEditingStatus() {
  offsetY = null; 
  patternInCreationNotes = [];
  patternInCreationPositions = [];
  editMode = EDIT_MODES.NOTE_MODE;

  lanes.forEach(lane => {
    lane.canvas.classList.remove('editing');
    lane.canvas.parentElement?.classList.remove('background');

    let laneEditingSection = lane.canvas.parentElement?.querySelector('.lane_editing');
    laneEditingSection?.classList.remove('activated')

    resetLanes();
    updateAllLaneSizes();
    drawSingleLane(lane);
  })
}





export function deleteLane(lane: Lane, canvas: HTMLCanvasElement) {
  resetLanesEditingStatus();
  
  let associatedCanvasContainer = canvas.closest('.canvas_container');
  if(!associatedCanvasContainer)
    return; 
  
  if(lane == longest_lane)
    resetLongestLane();

  delete input_lane_pairs[lane.inputKey];
  lanes.splice(lanes.indexOf(lane), 1);
  delete canvas_lane_pairs[canvas.id];
  
  associatedCanvasContainer.remove();  
  setLongestLane();

  laneCount--; 
  lanes.forEach(lane => {
    lane.canvas.classList.remove('editing');
    lane.canvas.parentElement?.classList.remove('background');
    
    let laneEditingSection = lane.canvas.parentElement?.querySelector('.lane_editing');
    laneEditingSection?.classList.remove('activated')
    
    resetLanes();
  })

  updateAllLaneSizes(); 
}


type EditMode = keyof typeof EDIT_MODES;
export function changeEditMode(newEditMode: EditMode) { editMode = newEditMode; }



// #region ( Event listeners )



function midiNoteOn(note: number) {
  let associatedLane = lanes[input_lane_pairs[note.toString()]];
  if(associatedLane != null)
    associatedLane.handleInputOn(paused); 
}

function midiNoteOff(note: number) {
  let associatedLane = lanes[input_lane_pairs[note.toString()]];
  if(associatedLane != null)
    associatedLane.handleInputOff(); 
}

const keyHeld: { [key: string]: boolean } = {};

function enableAudio() {
  if(audioSprite) 
    return;

  // TODO:  Combine these into one sprite and remove metronome sprite from lane 
  // audioSprite = new AudioSprite({
  //   "src": [
  //     "src/assets/sounds/drums.mp3"
  //   ],
  //   "sprite": {
  //     "clap": [
  //       0,
  //       734.2630385487529
  //     ],
  //     "closed-hihat": [
  //       2000,
  //       445.94104308390035
  //     ],
  //     "crash": [
  //       4000,
  //       1978.6848072562354
  //     ],
  //     "kick": [
  //       7000,
  //       553.0839002267571
  //     ],
  //     "open-hihat": [
  //       9000,
  //       962.7664399092968
  //     ],
  //     "snare": [
  //       11000,
  //       354.48979591836684
  //     ]
  //   }
  // });

  audioSprite = new AudioSprite({
    "src": [
      "/sounds/sounds.mp3"
    ],
    "sprite": {
      "crash": [
        0,
        724.37641723356
      ],
      "hihat_open_close": [
        2000,
        391.3378684807256
      ],
      "hihatClose": [
        4000,
        119.13832199546448
      ],
      "hihatOpen": [
        6000,
        457.1428571428573
      ],
      "kick1": [
        8000,
        328.18594104308477
      ],
      "kick2": [
        10000,
        528.0045351473923
      ],
      "kick3": [
        12000,
        307.3922902494335
      ],
      "metronomeOff": [
        14000,
        17.142857142857792
      ],
      "metronomeOn": [
        16000,
        25.328798185942247
      ],
      "ride": [
        18000,
        807.3922902494317
      ],
      "snare1": [
        20000,
        292.9024943310665
      ],
      "snare2": [
        22000,
        196.55328798186034
      ],
      "snare3": [
        24000,
        310.02267573695974
      ],
      "tom": [
        26000,
        534.8752834467127
      ],
      "wrongNote": [
        28000,
        313.0612244897968
      ]
    }
  });


  lanes.forEach(lane => {
    lane.audioSprite = audioSprite;
    // lane.metronomeSprite = metronomeSprite;
  })
}


function canvasMouseWheel(event: WheelEvent) { 
  let canvas = event.target as HTMLCanvasElement;
  if(!editing || !canvas.classList.contains('editing'))
    return; 

  let lane = findLaneFromEvent(event);
  if(lane.translationAmount - event.deltaY/2.5 > 0)
    lane.translationAmount -= event.deltaY/2.5; 
  drawSingleLane(lane);

  // if(event.deltaY > 0) {
  //     console.log('scroll down in edit mode');    
  // } else {
  //     console.log('scroll up in edit mode');
  // }
}

let offsetY:number | null = 0; 
function canvasMouseOver(event: MouseEvent) {
  let canvas = event.target as HTMLCanvasElement;
  if(!editing || !canvas.classList.contains('editing'))
    return; 

  offsetY = event.offsetY;
  let lane = findLaneFromEvent(event);
  drawSingleLane(lane);
}

function canvasMouseOut(event: MouseEvent) {
  let canvas = event.target as HTMLCanvasElement;
  if(!editing || !canvas.classList.contains('editing'))
    return; 

  let associatedLane = findLaneFromEvent(event);

  offsetY = null;
  console.log(offsetY);
  drawSingleLane(associatedLane);
}

// TODO: Comment out the flow of this function. Potentially restructure to make it more readable. 
async function handleCanvasClick(event: MouseEvent) {
  if(!editing)
    return; 

  console.log(newNoteIndex);

  let canvas = event.target as HTMLElement; 

  if(canvas.classList.contains('editing')) {
    // click while in edit mote     
    let lane = findLaneFromEvent(event); 
    let sortedIndex;
    
    if(editMode == EDIT_MODES.CREATE_PATTERN_MODE)
      sortedIndex = findSortedIndex(patternInCreationNotes, newNoteIndex, lane);
    else 
      sortedIndex = findSortedIndex(lane.notes, newNoteIndex, lane);   
    console.log(sortedIndex);   
    
    if(sortedIndex[1] == 1 && editMode != EDIT_MODES.PATTERN_MODE) {
      if(event.button == 2) {
        if(editMode == EDIT_MODES.CREATE_PATTERN_MODE) {
          patternInCreationNotes.splice(sortedIndex[0], 1);
          patternInCreationPositions.splice(sortedIndex[0], 1);
          console.log(patternInCreationPositions);
        } else {
          let y = lane.notes[sortedIndex[0]].getY(lane.noteGap, lane.innerSubdivision, lane.startY); 
          let currentMeasure = Math.floor((Math.abs(lane.startY - y)/measureHeight)); 

          console.log(`Deleting in measure ${currentMeasure}`);

          if(sortedIndex[0] > 0 && sortedIndex[0] == lane.notes.length - 1) {
            let previousNoteY = lane.notes[sortedIndex[0] - 1].getY(lane.noteGap, lane.innerSubdivision, lane.startY); 
            let previousNoteMeasure = Math.floor((Math.abs(lane.startY - previousNoteY)/measureHeight)); ; 

            if(previousNoteMeasure < currentMeasure)
              lane.setPatternStartMeasure(previousNoteMeasure + 1);
              // lane.patternStartMeasure = previousNoteMeasure + 1;
          } else if(sortedIndex[0] == 0 && lane.notes.length == 1) {
            // lane.patternStartMeasure = 0; 
            lane.setPatternStartMeasure(0);
          }

          if(lane.repeated) {
            lane.notes.splice(lane.notes.length - lane.repeatedNotes, lane.repeatedNotes);
            lane.notes.splice(sortedIndex[0], 1);
            if(lane.notes.length > 0)
              lane.repeatNotes();
          } else {
            lane.notes.splice(sortedIndex[0], 1);
          }
        }

        drawSingleLane(lane); 
      }
      return;
    } else if(event.button != 2 && editMode != EDIT_MODES.PATTERN_MODE) {
      let newNote = new Note(newNoteIndex);
      // console.log(newNoteIndex);
      // console.log(newNote.getY(lane.noteGap, lane.innerSubdivision, lane.startY) - lane.startY); 

      if(editMode == EDIT_MODES.CREATE_PATTERN_MODE) {
        patternInCreationNotes.splice(sortedIndex[0], 0, newNote);

        let divider = 16/lane.timeSignature[1]; 
        let height = lane.noteGap/divider; 
        
        // TODO: GET Y FROM INDEX.
        let y = patternInCreationNotes[sortedIndex[0]].getY(lane.noteGap, lane.innerSubdivision, lane.startY); 
        // let dif = (y - lane.startY) / height;
        console.debug(patternInCreationNotes[sortedIndex[0]].index);

        patternInCreationPositions.splice(sortedIndex[0], 0, patternInCreationNotes[sortedIndex[0]].index);

        console.log(patternInCreationPositions);

      } else {
        if(lane.repeated) {
          lane.notes.splice(lane.notes.length - lane.repeatedNotes, lane.repeatedNotes);
          lane.notes.splice(sortedIndex[0], 0, newNote)
          lane.repeatNotes();
        } else {
          lane.notes.splice(sortedIndex[0], 0, newNote)
        }

        let y = newNote.getY(lane.noteGap, lane.innerSubdivision, lane.startY); 
        let currentMeasure = Math.floor((Math.abs(lane.startY - y)/measureHeight)); 
        
        if(currentMeasure >= lane.patternStartMeasure)
          lane.setPatternStartMeasure(currentMeasure + 1);
      }
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

  let noteModeButton = laneEditingSection?.querySelector('.note_mode_button');
  let patternModeButton = laneEditingSection?.querySelector('.pattern_mode_button');

  if(noteModeButton?.classList.contains('selected'))
    editMode = EDIT_MODES.NOTE_MODE;
  else if(patternModeButton?.classList.contains('selected'))
    editMode = EDIT_MODES.PATTERN_MODE;
  console.log(editMode, noteModeButton, patternModeButton);

  lanes.forEach(lane => {
    if(lane.canvas != canvas) {
      lane.canvas.classList.remove('editing');
      lane.canvas.parentElement?.classList.add('background');
    } else {
      updateLaneWidth(lane, 1); 
      resetLanes();
      drawSingleLane(lane);
    }
  })

  let laneSelect = laneEditingSection?.querySelector('.load_lane_select');
  let laneSelectInnerHTML = '';

  let data = await retrieveBucketList('lanes');
  data?.forEach((pattern) => {
    laneSelectInnerHTML += getPatternOptionHTML(pattern.name); 
  })
  
  if(laneSelect)
    laneSelect.innerHTML = laneSelectInnerHTML; 

  console.log(laneSelect); 

}

// TODO: Reword this and rework it too, split it into seperate functions
let newNoteY = -1; 
let newNoteIndex = 0;
export function drawSingleLane(lane: Lane) {
  lane.ctx.clearRect(0, 0, lane.canvas.width, lane.canvas.height - lane.inputAreaHeight);
  lane.drawHitzone();
  
  if(editMode == EDIT_MODES.CREATE_PATTERN_MODE)
    lane.drawMeasureIndicators(editMode, newPatternMeasures);
  else
    lane.drawMeasureIndicators(editMode);
  // lane.updateNotes(ups, 0);

  if(editMode == EDIT_MODES.CREATE_PATTERN_MODE)
    lane.updateAndDrawNotes(editing, ups, 0, patternInCreationNotes); 
  else
    lane.updateAndDrawNotes(editing, ups, 0); 

  lane.drawInputVisual();

  if(editing && editMode != EDIT_MODES.PATTERN_MODE) {
    // TODO: Hold shift to be continuous. 
    // let divider = 16/lane.timeSignature[1];

    let height = lane.noteGap/lane.innerSubdivision; 
    // if(lane.subdivision < 4)
    //   height = lane.noteGap/6;
    // else if(lane.subdivision < 7)
    //   height = lane.noteGap/4;
    // else
    //   height = lane.noteGap/2;
    
    // TODO: If time come back. Divider must be even, and be divisible by original value determined above.
    // if(keyHeld['Control']) {
    //   const MAX_DISVISOR = 100; 
      
    //   let divisor = 1; 
    //   for(; divisor <= MAX_DISVISOR; divider++) {
    //     if(lane.noteGap/divisor < 15)
    //       break; 

    //     divisor++;
    //     height = lane.noteGap/divisor; 
    //   }
    //   console.log(divisor)
    //   height = lane.noteGap/12; 
    // }
      // height = lane.noteGap/12.5; 

    // let drawHeight = lane.noteGap/(lane.timeSignature[1] * lane.timeSignature[0]);
    let drawHeight = 12.5;
    
    // So that only non repeated part of lane is shown in edit mode
    let topOfLane = lane.calculateTopOfLane(false); 
    if(editMode == EDIT_MODES.CREATE_PATTERN_MODE)
        topOfLane = lane.calculateTopOfMeasuresN(newPatternMeasures); 

    for(let y = lane.startY; y > topOfLane; y -= height) {    
      if(y - topOfLane < 1)
        break;

      let effectiveY = y + lane.translationAmount; 
      if(effectiveY > lane.canvas.height)
        continue; 

      if(effectiveY < -lane.noteGap)
        break;

      // if(!keyHeld['Control']) {          
      // }
      lane.ctx.fillStyle = COLORS.NOTE_AREA_HIGHLIGHT;
      lane.ctx.beginPath();
      lane.ctx.roundRect(30, effectiveY - (drawHeight/2), lane.canvas.width - 60, drawHeight, 20); 
      lane.ctx.fill();
      

      if(offsetY == null)
        continue;

      let effectiveOffsetY = offsetY - translationAmount;
      if(effectiveOffsetY > (effectiveY - (height/2)) && effectiveOffsetY <= (effectiveY - (height/2)) + height) {
        newNoteY = y; 
        // newNoteIndex = (lane.startY - newNoteY) / (lane.noteGap/lane.timeSignature[1]);
        // newNoteIndex = Math.round((lane.startY - newNoteY) / (lane.noteGap/lane.timeSignature[1]));

        newNoteIndex = Math.round(parseInt(((lane.startY - newNoteY) / (lane.noteGap/lane.innerSubdivision)).toFixed(1)));
        // console.log(newNoteIndex);
        
        // let inverse = ((newNoteIndex * (lane.noteGap/lane.timeSignature[1])) - lane.startY) * -1;
        // console.log(newNoteY, " : ", newNoteIndex, " : ", inverse);

        // console.log(newNoteY);
        // console.log(lane.notes);
        let width = lane.canvas.width/2; 
        let x = (width) - (width/2);

        // console.log(newNoteIndex); 
        // let sortedIndex = findSortedIndex(lane.notes, newNoteIndex, lane);   
        // if(sortedIndex[1] == 1)
        //   lane.ctx.fillStyle = 'red'
        // else 
        //   lane.ctx.fillStyle = COLORS.HIGHLIGHTED_NOTE_FILL;

        lane.ctx.fillStyle = COLORS.HIGHLIGHTED_NOTE_FILL        
        lane.ctx.beginPath();
        lane.ctx.roundRect(x, effectiveY - (drawHeight/2), width, drawHeight, 20); 
        lane.ctx.fill();
      }
    }
  }
}

function drawLanes() {
  lanes.forEach(lane => {
    lane.ctx.clearRect(0, 0, lane.canvas.width, lane.canvas.height - lane.inputAreaHeight);
    lane.drawHitzone();
    lane.drawMeasureIndicators();
    lane.updateAndDrawNotes(editing, ups, 0); 
    lane.drawInputVisual();
  })
}

// #region ( Main game loop )
let lastLoop = performance.now();
let updateTime = 0; 
let filterStrength = 20; 

let animationFrameId: number | null = null; 
// TODO: Pause updating when the window is out of focus. 
function gameLoop(timeStamp: number) {
  // Calculating the number of updates per second
  // Relevant for determining the time it will take for notes to reach the hitzone 
  let interval = timeStamp - lastLoop; 
  if(!paused)
    currentTime += interval;

  updateTime += (interval - updateTime) / filterStrength; 
  ups = (1000/updateTime); 
  // upsParagraph!.innerText = ups.toString().substring(0, 6); 
  lastLoop = timeStamp;
 
  for(let lane of lanes) {

    if(!lane.noFail && lane.notesMissed.length + lane.wrongNotes.length >= lane.maxWrongNotes) {
      console.log(lane);
      (document.querySelector('#session_stop_button') as HTMLElement)?.click();
    }

    if(paused) {
      lane.drawInputVisual(); // So that when paused an in edit mode you can verify that your input mode works
      continue;
    }
    // console.log(`${lane.translationAmount} : ${interval} : ${measureHeight/lane.timeSignature[1]} : ${lane.bpm}`); 
  
    
    // Determining the speed of translation for each lane based on the current loop interval
    let translationSpeed = (interval / (60000/lane.bpm)) * (measureHeight/lane.timeSignature[1]);
    lane.translationAmount += translationSpeed;
  
    lane.ctx.clearRect(0, 0, lane.canvas.width, lane.canvas.height - lane.inputAreaHeight);
    lane.drawHitzone();
    lane.drawMeasureIndicators();
    lane.updateAndDrawNotes(editing, ups, translationSpeed);
    lane.drawInputVisual();
  
  
    // If both tops are visible. Take whichever tranlsation amount is highest. 
    let topOfLongestLaneVisible = -(longest_lane.translationAmount + ((measureHeight/longest_lane.timeSignature[1])/longest_lane.timeSignature[1])) < (longest_lane.calculateTopOfLane(false));
    let topOfCurrentLaneVisible = -(lane.translationAmount + ((measureHeight/lane.timeSignature[1])/lane.timeSignature[1])) < (lane.calculateTopOfLane(lane.repeated));
  
  
    if(topOfLongestLaneVisible && topOfCurrentLaneVisible) {
      let oldTranslationAmount = lane.translationAmount; 
  
      // lane.translationAmount = lane.translationAmount - lane.height - (lane.noteGap);
      
      
      let longest_t = longest_lane.translationAmount - longest_lane.height - ((measureHeight/longest_lane.timeSignature[1])); 
      let current_t = lane.translationAmount - (-lane.calculateTopOfLane(lane.repeated) + lane.startY) - (measureHeight/lane.timeSignature[1]);
      lane.translationAmount = longest_t < current_t ? longest_t : current_t; 
  
      
      lane.drawLoopIndicator();
      if(looping) {
        lane.drawMeasureIndicators();
        lane.updateAndDrawNotes(true, ups, translationSpeed);      
      }
      lane.translationAmount = oldTranslationAmount
    } 
  
    if(lane == longest_lane) {
      // console.log(lane.inputKey);
      let overshoot = ((lane.startY - lane.translationAmount) + (measureHeight/lane.timeSignature[1])) - lane.calculateTopOfLane(false);
      if(overshoot <= 0 && looping) {
        resetLanes(overshoot);
        // TODO: See if this is needed
        // window.requestAnimationFrame(gameLoop); // Ensures all lanes stay tightly in sync
        // restartLoop(); 
        // return; 
        break;
      } else if(overshoot <= 0) {
        // TODO: See if this can be reworked
        (document.querySelector('#session_stop_button') as HTMLElement)?.click();
      }
    }

  }

  animationFrameId = window.requestAnimationFrame(gameLoop);
}


export async function startLoop() {
    initalizeListeners();
    window.requestAnimationFrame(gameLoop);
}
// #endregion

// #section ( Run Controls Event Handlers ) 
// TODO: Look into single lane playing while in edit mode
export function onPlayButtonClick() {
  if(editing) // Should never be true due to React logic, but here just incase
    return;
  
  if(!audioSprite) 
    enableAudio(); // Required to be triggerd by user action

  paused = false; 
}

export function onPauseButtonClick() {
  console.log("On paused button click");
  if(editing) // Should never be true due to React logic, but here just incase
    return;

  paused = true 
}

export function onStopButtonClick(): {stats: StatsObject[], statsDisqualified: boolean} {
  if(editing) // Should never be true due to React logic, but here just incase
    return {stats: [], statsDisqualified: false};
  
  paused = true 
  
  let stats: StatsObject[] = [];
  // TODO: Put this in own function
  lanes.forEach(lane => {
    stats[stats.length] = {
      lane: lane.inputKey, 
      totalNotes: lane.notes.length * lane.loopCount, 
      notesHit: lane.notesHit, 
      notesMissed: lane.notesMissed, 
      wrongNotes: lane.wrongNotes,
      runTotalTime: currentTime
    };
  })
  currentTime = 0; 

  resetLanes();
  let noFail = false; 
  lanes.forEach(lane => { drawSingleLane(lane); if(lane.noFail){noFail = true} });
  return {stats: stats, statsDisqualified: noFail};
}

export function onEditButtonClick() {
  paused = true;
  editing = !editing;
  offsetY = null;
  
  resetLanes();
  // TODO: Put this in own function
  lanes.forEach(lane => {
    lane.ctx.clearRect(0, 0, lane.canvas.width, lane.canvas.height - lane.inputAreaHeight);

    lane.drawHitzone();
    lane.drawMeasureIndicators();
    // lane.updateNotes(ups, 0);
    lane.updateAndDrawNotes(editing, ups, 0);
    lane.drawInputVisual();
  });

  if(editing) {
    laneContainer?.classList.add('editing');
  } else {
    laneContainer?.classList.remove('editing');

    lanes.forEach(lane => {
      lane.canvas.classList.remove('editing');
      lane.canvas.parentElement?.classList.remove('background');

      let laneEditingSection = lane.canvas.parentElement?.querySelector('.lane_editing');
      laneEditingSection?.classList.remove('activated')
    })
  
    // TODO: Dynamic
    resetLanes();
    updateAllLaneSizes();
    drawLanes();
  }
}

export function onAddLaneButtonClick(inputKey: string) {  
  if(!paused || laneCount >= 6)
    return; 

  let canvasContainer = createNewLane(80, 1, 200, 'kick1', 5, [], [4, 4], inputKey ? inputKey : "(?)", 16);

  resetLanes();
  drawLanes();

  return canvasContainer; 
}
// #endsection


export function findLaneFromCanvas(canvas: HTMLCanvasElement) {
  return canvas_lane_pairs[canvas.id];
}

// Expose to window during dev or test mode
// @ts-ignore
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.findLaneFromCanvas = findLaneFromCanvas;
  // @ts-ignore
  window.lanes = lanes; 
  // @ts-ignore
  window.longest_lane = longest_lane; 
  // @ts-ignore
  window.input_lane_pairs = input_lane_pairs;
  // @ts-ignore
  window.canvas_lane_pairs = canvas_lane_pairs;
}


// TODO: Change this implementation
export function setNewPatternMeasures(measures: number) {
  newPatternMeasures = measures
}

export function assignLaneInput(lane: Lane, inputKey: string) {
  inputKey = inputKey.toUpperCase(); 
  if(Object.keys(input_lane_pairs).includes(inputKey)) {
    console.error('Input key already in use');
    return -1;
  }

  delete input_lane_pairs[lane.inputKey];

  lane.inputKey = inputKey; 
  input_lane_pairs[inputKey] = lanes.indexOf(lane); 
  drawSingleLane(lane); 
  
  saveCurrentSessionLocally(); 
  return 0;
}

export function resetLongestLane() {
  longest_lane = lanes[0]; 
}

export function setLongestLane() {   
  if(lanes.length > 0) 
    longest_lane = lanes[0]; 

  lanes.forEach(curr => {
    if(curr.getRatio() > longest_lane.getRatio()) {
      longest_lane = curr; 
    }
  });

  lanes.forEach(curr => {
    if(curr.repeated && curr.getRatio() >= longest_lane.getRatio()) {
      curr.unrepeatNotes();
    }
  })
}

export function toggleLooping() { looping = !looping; console.log(looping)}

export function saveCurrentSessionLocally() {
  let sessionObject: { lanes: Lane[] } = { lanes: [] };
  lanes.forEach(lane => { sessionObject.lanes.push(lane); });
  let content = JSON.stringify(sessionObject);
  saveToLocalStorage('current_session', content); 
}

// TODO: Make sure this is complete
export function remapLane(target: Lane, reference: Lane, copyInput?: boolean) {
  console.log('remap called');
  
  target.bpm =  reference.bpm; 
  target.noteGap = reference.noteGap; 
  target.hitsound = reference.hitsound; 
  target.measureCount = reference.measureCount; 
  target.hitPrecision = reference.hitPrecision; 
  target.maxWrongNotes = reference.maxWrongNotes; 
  target.timeSignature = reference.timeSignature; 
  target.metronomeEnabled = reference.metronomeEnabled;
  
  target.subdivision = reference.subdivision; 
  target.innerSubdivision = reference.innerSubdivision; 

  target.repeated = reference.repeated;
  target.repeatedNotes = reference.repeatedNotes;

  target.patternStartMeasure = reference.patternStartMeasure; 

  target.notes = []; 
  target.translationAmount = 0;
  target.nextNoteIndex = 0; 

  if(copyInput)
    target.inputKey = reference.inputKey; 

  target.noFail = reference.noFail; 

  // TODO: Optimize this for lower load times
  reference.notes.forEach((note) => { target.notes.push(new Note(note.index)) });
  
  target.hitzone = target.calculateHitzone(); 
  target.recalculateHeight(); 
  target.handleResize();
  drawSingleLane(target); 

  setLongestLane();
}


export function getEditMode() { return editMode }


export function setPatternInCreation(notePositions: number[]) {
  patternInCreationNotes = [];
  patternInCreationPositions = [];

  notePositions.forEach(position => {
    patternInCreationPositions.push(position); 
    patternInCreationNotes.push(new Note(position));
  });

  
}