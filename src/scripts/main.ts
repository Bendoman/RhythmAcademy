// #region ( Imports )
import Lane from "./Lane.ts"
import Note from "./Note.ts";
import AudioSprite from "./AudioSprite.ts";
import { COLORS, EDIT_MODES } from "./constants.ts";
import { resetLaneStats, findSortedIndex } from "./Utils.ts";
import { getLaneEditingHTML, getPatternOptionHTML } from "./elements.ts";

import { supabase } from '../scripts/supa-client.ts';
import { useContext } from "react";
import { UserContext } from "../components/App.tsx";
import { StatsObject } from "./types.ts";

// #endregion

// ( Midi Access Setup )
// if(navigator.requestMIDIAccess) { // Ensures that MIDI access is enabled in the current browser
//   navigator.requestMIDIAccess().then(midi_connection_success, midi_connection_failure);
// }

// TODO: Will need redo this so that it runs by default. Will need to remove existing event listeners.
// function midi_connection_success(midiAccess: MIDIAccess) {
//   midiAccess.onstatechange = updateDevices;
//   const inputs = midiAccess.inputs;
  
//   inputs.forEach(input => { input.onmidimessage = processMidiMessage;});
// }
// // TODO: Alert the user in input selection menu of the failure
// function midi_connection_failure() { console.log("Failed to connect midi device"); }

// MIDI related
// TODO: Dynamically update list of available midi inputs 
// function updateDevices(event: Event) { console.log(event); }

export function handleMIDIMessage(input: MIDIMessageEvent) {
    const inputData = input.data; 
    if(inputData == null)
      return; 

    const note = inputData[1];
    const velocity = inputData[2];
    console.log(note);

    if(velocity > 0) {
      midiNoteOn(note, velocity)
    } else { 
      // If velocity == 0 then it is an indication that the note has been released
      midiNoteOff(note);
    }
}

// #region ( Global variables )
let lanes: Lane[] = []; 
// Associates an inputkey string with the index of its associated lane within the lanes list
const input_lane_pairs: { [key: string ]: number } = {}; 
// Associates a canvas' ID with its lane
const canvas_lane_pairs: { [key: string ]: Lane } = {};

let laneCount = 0; 
export let maxMeasureCount = 400; 

let ups = 0; 
let translationAmount = 0; 

let paused = true; 
let editing = false;
let editMode: EditMode = EDIT_MODES.NOTE_MODE;

let audioSprite: AudioSprite;

let laneContainer: HTMLElement | null;
let container_width:number | undefined;
let container_height:number | undefined;

// Pattern creation 
export let patternInCreationNotes: Note[] = []; 
export let patternInCreationPositions: number[] = []; 

export function resetPatternInCreation() {
  patternInCreationNotes = [];
  patternInCreationPositions = [];
}
let newPatternMeasures = 1; 

// DOM Elements
let upsParagraph: HTMLElement | null;

// Buttons 
let editButton: HTMLElement | null;
let playButton: HTMLElement | null;
let stopButton: HTMLElement | null;
let pauseButton: HTMLElement | null;
let addLaneButton: HTMLElement | null;
let settingsButton: HTMLElement | null;

// Settings panel
let workspaceMeasureCountInput: HTMLElement | null;
// #endregion

let newLaneInput: HTMLElement | null;
let settingsPanel: HTMLElement | null;
let settingsCloseButton: HTMLElement | null;


// TODO: Move all of these somewhere more appropriate
function retrieveElements() {
    settingsPanel = document.getElementById('settings_panel');

    settingsButton = document.getElementById('settings_button');
    settingsButton?.addEventListener('click', () => {
      // console.log("in here")
        // paused = true; 
        // pauseButton?.classList.add('selected');
        // playButton?.classList.remove('selected');
        // stopButton?.classList.remove('selected');
        // editButton?.classList.remove('selected');
      
        if(settingsPanel?.classList.contains('visible'))
          settingsPanel?.classList.remove('visible');
        else 
          settingsPanel?.classList.add('visible');
      });

    settingsCloseButton = document.getElementById('settings_panel_close'); 
    settingsCloseButton?.addEventListener('click', () => {
        settingsPanel?.classList.remove('visible');
      });

    newLaneInput = document.getElementById('new_lane_input') as HTMLInputElement;
    
    window.addEventListener('keydown', (event) => {
        if(keyHeld[event.key] == true)
          return;
      
        let associatedLane = lanes[input_lane_pairs[event.key]];
        if(associatedLane != null)
          associatedLane.handleInputOn(paused); 
      
        keyHeld[event.key] = true
    
    })

    window.addEventListener('keyup', (event) => {
        let associatedLane = lanes[input_lane_pairs[event.key]];
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

    editButton = document.getElementById('edit_button')
    editButton?.addEventListener('click', () => {
        console.log('edit')
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
        })
        
      
        if(editing) {
          editButton.classList.add('selected');
          playButton?.classList.remove('selected');
          pauseButton?.classList.remove('selected');
          stopButton?.classList.remove('selected');
          laneContainer?.classList.add('editing');
        } else {
          editButton.classList.remove('selected');
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
      });
      


    playButton = document.getElementById('play_button');
    playButton?.addEventListener('click', () => { 
        // TODO: Look into single lane playing while in edit mode
        if(editing)
          return;
        
        if(!audioSprite)
          enableAudio(); 
      
        paused = false; 
      
        playButton.classList.add('selected');
        pauseButton?.classList.remove('selected');
        stopButton?.classList.remove('selected');
        editButton?.classList.remove('selected');
      });

    stopButton = document.getElementById('stop_button');
    stopButton?.addEventListener('click', () => {
        // TODO: Look into single lane playing while in edit mode
        if(editing)
          return;
        
        paused = true 

        lanes.forEach(lane => {
          console.log(`${lane.canvas.id}_lane stats:\nTotal Notes: ${lane.notes.length}\nNotes hit: ${lane.notesHit.length}\nNotes missed: ${lane.notesMissed.length}`);
          console.log(lane.notesHit);
          console.log(lane.notesMissed);
        });

      
        resetLanes();
        // TODO: Put this in own function
        lanes.forEach(lane => {
          lane.ctx.clearRect(0, 0, lane.canvas.width, lane.canvas.height - lane.inputAreaHeight);
      
          lane.drawHitzone();
          lane.drawMeasureIndicators();
          lane.updateAndDrawNotes(editing, ups, 0);
          lane.drawInputVisual();
        });
      
        stopButton.classList.add('selected');
        playButton?.classList.remove('selected');
        pauseButton?.classList.remove('selected');
        editButton?.classList.remove('selected');
      });

    pauseButton = document.getElementById('pause_button');
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

    addLaneButton = document.getElementById('add_lane_button')
    addLaneButton?.addEventListener('click', () => {
        let input = newLaneInput.value;
        console.log(laneCount);
        if(!input || laneCount >= 6)
          return;
      
        paused = true; 
        createNewLane(80, 1, 200, 'kick', 3, [], [4, 4], input, 16);
      
        updateAllLaneSizes();
        resetLanes();
        drawLanes();
        
    });


    upsParagraph = document.getElementById('ups_paragraph') as HTMLElement;


    workspaceMeasureCountInput = document.getElementById('workspace_measure_count');
    workspaceMeasureCountInput?.addEventListener('change', (event) => {
        let target = event.target as HTMLSelectElement;
        console.log(target.value); 
        maxMeasureCount = parseInt(target.value); 
      
        lanes.forEach(lane => {
          lane.maxMeasureCount = maxMeasureCount; 
          lane.loopedHeight = lane.calculateHeight(true); 
        })
      })
}


function resetLanes() {
    lanes.forEach(lane => {
      lane.resetLane();
    })
}

function populateTestNotes(lane: Lane) {
  // Creates an 8th note swing pattern
  resetLaneStats(lane);

  let startY = lane.startY;
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
    let height = lane.noteGap/(lane.timeSignature[1] * lane.timeSignature[0])

    if(height < 5)
      height = 5; 

    let newNote = new Note(y);
    lane.notes.push(newNote);
  }
  console.log(lane.notes);
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

  const new_lane = new Lane(bpm, measureCount, maxMeasureCount, noteGap, hitsound, maxWrongNotes, notes, timeSignature, inputKey, newCanvas, hitPrecision);

  // TODO: Review if these can be unified
  lanes.push(new_lane); 
  // console.log(`Adding new lane: to lanes`); 
  // console.log(new_lane)
  input_lane_pairs[new_lane.inputKey] = lanes.length - 1;
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

  // TODO: Put all this in its own function
  document.getElementById(`${newCanvas.id}`)?.addEventListener('mousemove', canvasMouseOver);
  document.getElementById(`${newCanvas.id}`)?.addEventListener('mouseout', canvasMouseOut);
  document.getElementById(`${newCanvas.id}`)?.addEventListener('wheel', canvasMouseWheel);
  
  // #region (old event listeners)
  document.getElementById(`${newCanvas.id}_pattern_mode`)?.addEventListener('click', patternModeClick);
  document.getElementById(`${newCanvas.id}_note_mode`)?.addEventListener('click', noteModeClick);

  document.getElementById(`${newCanvas.id}_bpm_input`)?.addEventListener('change', bpmInputChange);
  document.getElementById(`${newCanvas.id}_measure_count_input`)?.addEventListener('change', measureCountChange);
  document.getElementById(`${newCanvas.id}_time_signature_select`)?.addEventListener('change', timeSignatureChange);
  document.getElementById(`${newCanvas.id}_precision_select`)?.addEventListener('change', precisionSelectChange);

  document.getElementById(`${newCanvas.id}_metronome_button`)?.addEventListener('click', metronomeButtonClick);
  document.getElementById(`${newCanvas.id}_loop_button`)?.addEventListener('click', loopButtonClick);

  document.getElementById(`${newCanvas.id}_clear_notes_button`)?.addEventListener('click', clearNotesClick);
  document.getElementById(`${newCanvas.id}_back_to_start`)?.addEventListener('click', backToStartClick);
  
  document.getElementById(`${newCanvas.id}_hitsound_select`)?.addEventListener('change', hitsoundSelectChange);
  document.getElementById(`${newCanvas.id}_metronome_select`)?.addEventListener('change', metronomeSelectChange);
  
  document.getElementById(`${newCanvas.id}_load_pattern_select`)?.addEventListener('change', patternSelectChange);  
  document.getElementById(`${newCanvas.id}_load_pattern_button`)?.addEventListener('click', loadPatternClick);
  document.getElementById(`${newCanvas.id}_loaded_pattern_measures`)?.addEventListener('change', loadedPatternMeasuresChange);

  document.getElementById(`${newCanvas.id}_create_pattern_button`)?.addEventListener('click', createPatternClick);
  document.getElementById(`${newCanvas.id}_new_pattern_measures`)?.addEventListener('change', newPatternMeasuresChange);
  document.getElementById(`${newCanvas.id}_save_pattern_button`)?.addEventListener('click', savePatternClick);
  document.getElementById(`${newCanvas.id}_close_pattern_button`)?.addEventListener('click', closePatternClick);
  
  document.getElementById(`${newCanvas.id}_load_lane_button`)?.addEventListener('click', loadLaneClick);
  document.getElementById(`${newCanvas.id}_save_lane_button`)?.addEventListener('click', saveLaneClick);




  document.getElementById(`${newCanvas.id}_close`)?.addEventListener('click', closeClick);
  document.getElementById(`${newCanvas.id}_delete`)?.addEventListener('click', deleteButtonClick);
  // #endregion

  // Dynamically updates lane widths based on the number of lanes
  updateAllLaneSizes();

  // return laneEditingSection;
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

// TODO: Add listener for esc key
function closeClick(event: MouseEvent) {
  offsetY = -10;
  patternInCreationNotes = [];
  patternInCreationPositions = [];
  editMode = EDIT_MODES.NOTE_MODE;

  let target = event.target as HTMLElement;
  let patternContainer = target.closest('.lane_editing')?.querySelector('.pattern_loading_container'); 
  console.log(patternContainer);
  let loadPatternButton = patternContainer?.querySelector('.load_pattern');
  let measuresContainer = patternContainer?.querySelector('.new_pattern_measures_container');
  let nameInput = patternContainer?.querySelector('.pattern_name');
  let saveButton = patternContainer?.querySelector('.save_pattern');
  let closeButton = patternContainer?.querySelector('.close_pattern');
  console.log(loadPatternButton);

  loadPatternButton?.removeAttribute('disabled');
  measuresContainer?.classList.remove('visible');
  nameInput?.classList.remove('visible');
  saveButton?.classList.remove('visible');
  closeButton?.classList.remove('visible');
  console.log('close clicked');

  offsetY = null; 

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

function metronomeSelectChange(event: Event) {
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);
  lane.metronomeSound = target.value; 
}

function precisionSelectChange(event: Event) {
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);
  lane.hitPrecision = parseInt(target.value);
  lane.hitzone = lane.calculateHitzone();
  // lane.metronomeSound = target.value; 
  drawSingleLane(lane);
  console.log(lane.hitPrecision)
}

export async function retrieveBucketList(bucket: string) {
  const { data, error } = await supabase.storage.from(bucket).list(user.user.id); 
  
  if(!error)
      return data; 
}

async function retrievePatternList() {
  const { data, error } = await supabase.storage.from('patterns').list(user.user.id); 
  
  if(!error)
      return data; 
}

export async function retrieveBucketData(bucket: string, path: string) {
  const { data, error } = await supabase
  .storage
  .from(bucket)
  .download(path);
  if(!error)
    return data.text().then(JSON.parse); 
}

async function loadPatternClick(event: Event) {
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);

  let patternSelect = target.parentElement?.previousElementSibling as HTMLSelectElement;
  let patternMeasures = target.nextElementSibling as HTMLInputElement; 
  let selectedPatternName = patternSelect.value; 
  
  if(!selectedPatternName || !patternMeasures.value)
    return; 

  // let selectedPatternJSON = localStorage.getItem(selectedPatternName); 
  // let selectedPattern = JSON.parse(selectedPatternJSON!);
  // let selectedPattern = await retrievePattern(selectedPatternName);
  let selectedPattern = await retrieveBucketData('patterns', `${user.user.id}/${selectedPatternName}`);
  console.log(selectedPattern);
  // let selectedPattern = JSON.parse(selectedPatternJSON!);
  
  console.log(selectedPatternName, selectedPattern, patternMeasures.value);
  lane.loadPattern(selectedPattern, parseInt(patternMeasures.value));

  drawSingleLane(lane); 
}

function createPatternClick(event: Event) {
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);
  console.log(lane);

  let measuresContainer = target.nextElementSibling;
  let nameInput = measuresContainer?.nextElementSibling;
  let saveButton = nameInput?.nextElementSibling;
  let closeButton = saveButton?.nextElementSibling;
  let patternMeasures = nameInput?.previousElementSibling?.querySelector(".new_pattern_measures") as HTMLInputElement; 

  let loadPatternButton = target.previousElementSibling?.querySelector('.load_pattern');
  if(loadPatternButton)
    loadPatternButton.setAttribute('disabled', ''); 


  measuresContainer?.classList.add('visible');
  nameInput?.classList.add('visible');
  saveButton?.classList.add('visible');
  closeButton?.classList.add('visible');

  editMode = EDIT_MODES.CREATE_PATTERN_MODE;
  newPatternMeasures = parseInt(patternMeasures.value); 

  console.log(editMode);

  drawSingleLane(lane); 
}


async function loadLaneClick(event: Event) {
  console.log(event);
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);
  
  let laneSelect = target?.parentElement?.previousElementSibling as HTMLSelectElement; 
  let newLaneName = laneSelect.value; 
  console.log(laneSelect.value);

  let data = await retrieveBucketData('lanes', `${user.user.id}/${newLaneName}`);
  let newLane: Lane = data.lane; 
  console.log(newLane);

  lane.bpm =  newLane.bpm; 
  lane.measureCount = newLane.measureCount; 
  lane.noteGap = newLane.noteGap; 
  lane.maxWrongNotes = newLane.maxWrongNotes; 
  lane.hitsound = newLane.hitsound; 
  lane.timeSignature = newLane.timeSignature; 
  lane.hitPrecision = newLane.hitPrecision; 
  lane.notes = []; 
  // TODO: Optimize this for lower load times
  newLane.notes.forEach((note) => {
    // TODO Change to new note with index constructor
    lane.notes.push(new Note(note.index));   
  })
  lane.hitzone = lane.calculateHitzone(); 
  lane.recalculateHeight(); 

  console.log(`${lane.canvas.id}_bpm_input}`);
  let bpmInput = document.getElementById(`${lane.canvas.id}_bpm_input`) as HTMLInputElement;
  bpmInput.value = lane.bpm.toString(); 

  let measureInput = document.getElementById(`${lane.canvas.id}_measure_count_input`) as HTMLInputElement;
  measureInput.value = lane.measureCount.toString(); 

  let hitPrecisionInput = document.getElementById(`${lane.canvas.id}_precision_select`) as HTMLInputElement;
  hitPrecisionInput.value = lane.hitPrecision.toString(); 

  let timeSignatureInput = document.getElementById(`${lane.canvas.id}_time_signature_select`) as HTMLInputElement;
  timeSignatureInput.value = `${lane.timeSignature[0].toString()}/${lane.timeSignature[1].toString()}`; 

  let laneSoundInput = document.getElementById(`${lane.canvas.id}_hitsound_select`) as HTMLInputElement;
  laneSoundInput.value = lane.hitsound; 

  // TODO: Add loading of metronome setting. 
  updateAllLaneSizes();
  lane.handleResize();
  drawSingleLane(lane); 
}

async function saveLaneClick(event: Event) {
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);

  let laneNameElement = target.previousElementSibling as HTMLInputElement; 
  let laneName = laneNameElement.value; 
  console.log(laneName); 

  if(!laneName)
    return; 
  
  let content = JSON.stringify({lane: lane, name: laneName});
  await uploadToBucket('lanes', `${user.user.id}/${laneName}`, laneName, content); 

  
  let laneSelect = target?.parentElement?.previousElementSibling; 
  let laneSelectInnerHTML = '';

  let data = await retrieveBucketList('lanes');
  data?.forEach((pattern) => {
    laneSelectInnerHTML += getPatternOptionHTML(pattern.name); 
  })
  
  if(laneSelect)
    laneSelect.innerHTML = laneSelectInnerHTML; 
}

function closePatternClick(event: Event) {
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);

  let saveButton = target?.previousElementSibling;
  let nameInput = saveButton?.previousElementSibling;
  let measuresContainer = nameInput?.previousElementSibling;

  let loadPatternButton = target.closest('.pattern_loading_container')?.querySelector('.load_pattern');
  if(loadPatternButton)
    loadPatternButton.removeAttribute('disabled'); 

  nameInput?.classList.remove('visible');
  saveButton?.classList.remove('visible');
  target?.classList.remove('visible');
  measuresContainer?.classList.remove('visible');

  editMode = EDIT_MODES.PATTERN_MODE;

  patternInCreationNotes = [];
  patternInCreationPositions = [];
  lane.translationAmount = 0;

  drawSingleLane(lane); 
}

export function deleteLane(lane: Lane, canvas: HTMLCanvasElement) {
  resetLanesEditingStatus();
  
  let associatedCanvasContainer = canvas.closest('.canvas_container');
  if(!associatedCanvasContainer)
    return; 
  
  delete input_lane_pairs[lane.inputKey];
  console.log(lanes);
  lanes.splice(lanes.indexOf(lane));
  console.log(lanes);
  delete canvas_lane_pairs[canvas.id];
  
  console.log(canvas_lane_pairs);
  console.log(input_lane_pairs);

  associatedCanvasContainer.remove();

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


function deleteButtonClick(event: Event) {


  let target = event.target as HTMLElement;
  let associatedCanvasContainer = target.closest('.canvas_container');
  let associatedCanvas = associatedCanvasContainer?.querySelector('canvas')!;
  let associatedLane = findLaneFromEvent(event);
  if(!associatedCanvasContainer)
    return; 

  delete input_lane_pairs[associatedLane.inputKey];
  console.log(lanes);
  lanes.splice(lanes.indexOf(associatedLane));
  console.log(lanes);
  delete canvas_lane_pairs[associatedCanvas.id];
  
  console.log(canvas_lane_pairs);
  console.log(input_lane_pairs);

  associatedCanvasContainer.remove();

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

// TODO: Put this in utils
export async function uploadToBucket(bucket: string, filePath: string, fileName: string, content: string) {
  const jsonBlob = new Blob([content], {type: "application/json"});
  const jsonFile = new File([jsonBlob], fileName, {type: "application/json"});
  
  const {data, error} = await supabase.storage
  .from(bucket)
  .upload(filePath, jsonFile);

  if(error) {
    console.log('upload error ', error); 
  } else {
    console.log('upload succsesful from new function', data);
  }
}

async function savePatternClick(event: Event) {
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);
  
  let patternNameElement = target.previousElementSibling as HTMLInputElement; 
  let patternMeasuresElement = patternNameElement.previousElementSibling?.querySelector(".new_pattern_measures") as HTMLInputElement; 

  let patternName = patternNameElement.value; 
  let patternMeasures = parseInt(patternMeasuresElement.value); 

  if(!patternName)
    return; 

  //TODO: Also check at loading side for 0 length patterns saved incase of somehow adding 0 length in another way
  if(patternMeasures == 0) {
    console.error("Empty pattern");
    return; 
  }

  localStorage.setItem(patternName, JSON.stringify({measures: patternMeasures, notePositions: patternInCreationPositions}));
  // TODO: Make fewer network requests. Keep local list of pattern names. No need for await then
  // await uploadPatternToBucket(patternName, patternMeasures, patternInCreationPositions);

  let content = JSON.stringify({measures: patternMeasures, notePositions: patternInCreationPositions});
  await uploadToBucket('patterns', `${user.user.id}/${patternName}`, patternName, content)

  let patternLoadingContainer = target.closest('.pattern_loading_container');
  let patternSelect = patternLoadingContainer?.querySelector('.load_pattern_select');
  let patternSelectInnerHTML = '';
  // Object.keys(localStorage).forEach(patternName => {
  //   patternSelectInnerHTML += getPatternOptionHTML(patternName); 
  // });

  // TODO: Make fewer network requests. Keep local list of pattern names. 
  let data = await retrieveBucketList('patterns');
  data?.forEach((pattern) => {
    patternSelectInnerHTML += getPatternOptionHTML(pattern.name); 
  })

  if(patternSelect)
    patternSelect.innerHTML = patternSelectInnerHTML; 

  console.log(localStorage.getItem(patternName));
}

// let selectedPatternName: any; 
function patternSelectChange(event: Event) {
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);

  // selectedPatternName = target.value;
  // console.log(selectedPatternName);
}

function newPatternMeasuresChange(event: Event) {
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);
  console.log(target.value);
  
  newPatternMeasures = parseInt(target.value); 

  
  drawSingleLane(lane); 
}

function loadedPatternMeasuresChange(event: Event) {
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);
  console.log(target.value);
}


function noteModeClick(event: Event) {
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);

  target.nextElementSibling?.classList.remove("selected");
  target.classList.add("selected");

  editMode = EDIT_MODES.NOTE_MODE;
  console.log(editMode);

  let patternLoadingContainer = target.closest(".lane_editing")?.querySelector('.pattern_loading_container');
  let patternContainer = target.closest('.lane_editing')?.querySelector('.pattern_container');

  let saveButton = patternLoadingContainer?.querySelector('.save_pattern');
  let closeButton = saveButton?.nextElementSibling;
  let nameInput = saveButton?.previousElementSibling;
  let measuresContainer = nameInput?.previousElementSibling;

  let loopButton = target.parentElement?.parentElement?.querySelector('.loop_button');

  if(maxMeasureCount % lane.measureCount == 0)
    loopButton?.removeAttribute('disabled');
  
  closeButton?.classList.remove('visible');
  nameInput?.classList.remove('visible');
  saveButton?.classList.remove('visible');
  measuresContainer?.classList.remove('visible');
  patternLoadingContainer?.classList.remove('visible');
  patternContainer?.classList.remove('visible');

  lane.translationAmount = 0; 

  patternInCreationNotes = []; 
  patternInCreationPositions = [];

  drawSingleLane(lane);
}

type EditMode = keyof typeof EDIT_MODES;
export function changeEditMode(newEditMode: EditMode) { editMode = newEditMode; }

export async function patternModeClick(event: Event) {
  console.log("HERE")
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);

  target.previousElementSibling?.classList.remove("selected");
  target.classList.add("selected");
 
  editMode = EDIT_MODES.PATTERN_MODE;
  console.log(editMode);

  let patternLoadingContainer = target.closest(".lane_editing")?.querySelector('.pattern_loading_container');
  patternLoadingContainer?.classList.add('visible');
  
  lane.translationAmount = 0; 
  lane.notes = [];
  
  let loopButton = target.parentElement?.parentElement?.querySelector('.loop_button');
  loopButton?.setAttribute('disabled', '');
  loopButton?.classList.remove('selected');
  lane.looped = false;
  lane.patternStartMeasure = 0;


  let patternSelect = patternLoadingContainer?.querySelector('.load_pattern_select');
  let patternSelectInnerHTML = '';
  // Object.keys(localStorage).forEach(patternName => {
  //     patternSelectInnerHTML += getPatternOptionHTML(patternName); 
  // });

  let data = await retrieveBucketList('patterns');
  data?.forEach((pattern) => {
    patternSelectInnerHTML += getPatternOptionHTML(pattern.name); 
  })
  
  if(patternSelect)
    patternSelect.innerHTML = patternSelectInnerHTML; 

  // REPLACE WITH LOAD FROM BUCKET
  
  
  drawSingleLane(lane);
}

function clearNotesClick(event: MouseEvent) {
  let lane = findLaneFromEvent(event);

  if(editMode == EDIT_MODES.CREATE_PATTERN_MODE) {
    patternInCreationNotes = []; 
    patternInCreationPositions = [];
  } else {
    lane.notes = [];
    lane.patternStartMeasure = 0; 
  }
  
  lane.translationAmount = 0; 
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
  let newMC = parseInt(target.value);
  
  let lane = findLaneFromEvent(event);
  if(newMC > maxMeasureCount)
    newMC = maxMeasureCount;

  let loopButton = target.closest('.lane_editing')!.querySelector('.loop_button') as HTMLButtonElement;
  if(newMC != maxMeasureCount && maxMeasureCount % newMC == 0)
    loopButton.removeAttribute('disabled');
  else 
    loopButton.setAttribute('disabled', '');

  lane.patternStartMeasure = 0;
  lane.measureCount = newMC;
  // So that input only displays max measure count
  target.value = newMC.toString(); 
  lane.translationAmount = 0; 
  
  // TODO: Add ability to keep notes before measure cut off
  lane.notes = [];
  lane.recalculateHeight();

  drawSingleLane(lane);
 
  console.log(target.value);
}

function loopButtonClick(event: Event) {
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);  

  // Lane has already been looped. Toggle looping off
  if(target.classList.contains('selected')) { 
    lane.notes.splice(lane.notes.length - lane.loopedNotes, lane.loopedNotes);
    lane.looped = false; 
    lane.loopedNotes = 0; 
    // TODO: DETERMINE IF THIS IS NECESSARY. TEST CASES OF LOOPING BEING TURNED OFF
    // lane.loopedHeight = lane.calculateHeight(false);
    target.classList.remove('selected');
    drawSingleLane(lane); 
    console.log(lane.notes);
    // TODO: Logic around resetting height and such
    return; 
  }
  target.classList.add('selected');
  lane.looped = true; 
  
  let loops = maxMeasureCount / lane.measureCount; 
  console.log(loops); 
  
  if(lane.notes.length > 0)
    lane.loopNotes(loops); 
  
  lane.loopedHeight = lane.calculateHeight(true); 
  lane.topOfLane = lane.calculateTopOfLane(true);
  drawSingleLane(lane); 

  console.log(lane.notes);
}

function timeSignatureChange(event: Event) {
  let target = event.target as HTMLSelectElement;
  let lane = findLaneFromEvent(event);

  let split = target.value.split('/');
  lane.timeSignature = [parseInt(split[0]), parseInt(split[1])];

  lane.notes = [];
  lane.translationAmount = 0; 
  lane.recalculateHeight();
  drawSingleLane(lane);

}

function metronomeButtonClick(event: MouseEvent) {
  let associatedLane = findLaneFromEvent(event);
  associatedLane.metronomeEnabled = !associatedLane.metronomeEnabled;
  console.log(associatedLane);
  let metronomeParagraph = document.getElementById(`${associatedLane.canvas.id}_metronome_paragraph`);
  if(metronomeParagraph)
    metronomeParagraph.innerHTML = `Metronome ${associatedLane.metronomeEnabled ? ' <b>(enabled)</b>' : ' <b>(disabled)</b>'}`;
  
  
  let target = event.target as HTMLButtonElement; 
  let metronomeButton = target.closest('.metronome_button');
  if(associatedLane.metronomeEnabled)
    metronomeButton?.classList.add('selected');
  else
    metronomeButton?.classList.remove('selected');
}




// Have a max number of measures. 
// createNewLane(60, 1, 200, 'kick', 3, [], [4, 4], 'a', 16);
// createNewLane(60, 200, 200, 'snare', 3, [], [4, 4], 's', 16);
// createNewLane(60, 200, 200, 'closed-hihat', 3, [], [4, 4], 'd', 16);

// #region ( Event listeners )

window.addEventListener('resize', () => {
  // TODO: Dynamically resize lanes
});

function midiNoteOn(note: number, velocity: number) {
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
  audioSprite = new AudioSprite({
    "src": [
      "src/assets/sounds/drums.mp3"
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

  // let metronomeSprite = new AudioSprite({
  //   "src": [
  //     "../metronome/metronome.mp3"
  //   ],
  //   "sprite": {
  //     "metronome1": [
  //       0,
  //       100.1360544217687
  //     ],
  //     "metronome2": [
  //       2000,
  //       100.13605442176888
  //     ],
  //     "metronome3": [
  //       4000,
  //       100.13605442176842
  //     ],
  //     "metronome4": [
  //       6000,
  //       100.13605442176842
  //     ],
  //     "metronome5": [
  //       8000,
  //       100.13605442176932
  //     ],
  //     "metronome6": [
  //       10000,
  //       100.13605442176932
  //     ]
  //   }
  // });

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

  if(event.deltaY > 0) {
      console.log('scroll down in edit mode');    
  } else {
      console.log('scroll up in edit mode');
  }
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


async function handleCanvasClick(event: MouseEvent) {
  if(!editing)
    return; 

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
          if(lane.looped) {
            lane.notes.splice(lane.notes.length - lane.loopedNotes, lane.loopedNotes);
            lane.notes.splice(sortedIndex[0], 1);
            lane.loopNotes(maxMeasureCount / lane.measureCount)
          } else {
            lane.notes.splice(sortedIndex[0], 1);
          }
        }

        drawSingleLane(lane); 
      }
      return;
    } else if(event.button != 2 && editMode != EDIT_MODES.PATTERN_MODE) {
      let newNote = new Note(newNoteIndex);

      if(editMode == EDIT_MODES.CREATE_PATTERN_MODE) {
        patternInCreationNotes.splice(sortedIndex[0], 0, newNote);

        let divider = 16/lane.timeSignature[1]; 
        let height = lane.noteGap/divider; 
        
        // TODO: GET Y FROM INDEX.
        let y = patternInCreationNotes[sortedIndex[0]].getY(lane.noteGap, lane.timeSignature[1], lane.startY); 
        let dif = (y - lane.startY) / height;
        patternInCreationPositions.splice(sortedIndex[0], 0, dif);
        
        console.log(patternInCreationPositions);

      } else {
        if(lane.looped) {
          lane.notes.splice(lane.notes.length - lane.loopedNotes, lane.loopedNotes);
          lane.notes.splice(sortedIndex[0], 0, newNote)
          lane.loopNotes(maxMeasureCount / lane.measureCount)
        } else {
          lane.notes.splice(sortedIndex[0], 0, newNote)
        }
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
let newNoteIndex = -1;
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
    let divider = 16/lane.timeSignature[1];
    let height = lane.noteGap/divider;
    let drawHeight = lane.noteGap/(lane.timeSignature[1] * lane.timeSignature[0])
    
    // So that only non looped part of lane is shown in edit mode
    let topeOfLane = lane.calculateTopOfLane(false); 
    if(editMode == EDIT_MODES.CREATE_PATTERN_MODE)
        topeOfLane = lane.calcualteTopOfMeasuresN(newPatternMeasures); 

    for(let y = lane.startY; y > topeOfLane; y -= height) {
      let effectiveY = y + lane.translationAmount; 
      if(effectiveY > lane.canvas.height)
        continue; 

      if(effectiveY < -lane.noteGap)
        break;

      lane.ctx.fillStyle = COLORS.NOTE_AREA_HIGHLIGHT;
      lane.ctx.beginPath();
      lane.ctx.roundRect(30, effectiveY - (drawHeight/2), lane.canvas.width - 60, drawHeight, 20); 
      lane.ctx.fill();

      if(offsetY == null)
        continue;

      let effectiveOffsetY = offsetY - translationAmount;
      if(effectiveOffsetY > (effectiveY - (height/2)) && effectiveOffsetY <= (effectiveY - (height/2)) + height) {
        newNoteY = y; 
        newNoteIndex = (lane.startY - newNoteY) / (lane.noteGap/lane.timeSignature[1]);
        // let inverse = ((newNoteIndex * (lane.noteGap/lane.timeSignature[1])) - lane.startY) * -1;
        // console.log(newNoteY, " : ", newNoteIndex, " : ", inverse);

        

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
  lanes.forEach(lane => {

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

let test = 0; 
// TODO: Pause updating when the window is out of focus. 
function gameLoop(timeStamp: number) {
  // Calculating the number of updates per second
  // Relevant for determining the time it will take for notes to reach the hitzone 
  let interval = timeStamp - lastLoop; 
  updateTime += (interval - updateTime) / filterStrength; 
  ups = (1000/updateTime); 
  upsParagraph.innerText = ups.toString().substring(0, 6); 
  lastLoop = timeStamp;

  lanes.forEach(lane => {
    if(paused) {
      lane.drawInputVisual(); // So that when paused an in edit mode you can verify that your input mode works
      return;
    }
    
    // Determining the speed of translation for each lane based on the current loop interval
    let translationSpeed = (interval / (60000/lane.bpm)) * lane.noteGap;
    lane.translationAmount += translationSpeed;
       
    lane.ctx.clearRect(0, 0, lane.canvas.width, lane.canvas.height - lane.inputAreaHeight);
    lane.drawHitzone();
    lane.drawMeasureIndicators();
    lane.updateAndDrawNotes(editing, ups, translationSpeed);
    lane.drawInputVisual();

  })
  // console.log(test); 
  window.requestAnimationFrame(gameLoop);
}

let user; 
export async function startLoop() {
    const { data: supaUser, error: userError } = await supabase.auth.getUser();


    // if (userError || !user?.user) {
    //   console.error("User not authenticated", userError);
    //   return;
    // }
    // TODO: Add error checking for user authentication
    if(supaUser.user)
      console.log(`Here as ${supaUser.user.id}`);
    user = supaUser; 

    retrieveElements();

    window.requestAnimationFrame(gameLoop);
}
// #endregion



// #section ( Run Controls Event Handlers ) 
// TODO: Look into single lane playing while in edit mode
export function onPlayButtonClick() {
  console.log("On play button click");
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

export function onStopButtonClick(): StatsObject[] {
  console.log("On stop button click");
  if(editing) // Should never be true due to React logic, but here just incase
    return [];
  
  paused = true 

  let stats: StatsObject[] = [];

  // TODO: Put this in own function
  lanes.forEach(lane => {
    console.log(`${lane.canvas.id}_lane stats:\nTotal Notes: ${lane.notes.length}\nNotes hit: ${lane.notesHit.length}\nNotes missed: ${lane.notesMissed.length}`);
    console.log(lane.notesHit);
    console.log(lane.notesMissed);

    stats[stats.length] = {
      lane: lane.inputKey, totalNotes: lane.notes.length, 
      notesHit: lane.notesHit, notesMissed: lane.notesMissed 
    };
  })

  console.log(stats); 

  resetLanes();
  lanes.forEach(lane => { drawSingleLane(lane); });
  return stats;
}

export function onEditButtonClick() {
  console.log("On edit button click");

  console.log('edit')
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
  })

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
  console.log(inputKey)
  
  if(!paused)
    return; 

  console.log("Add button click: ", inputKey);
  // let input = newLaneInput.value;
  console.log(laneCount);
  if(laneCount >= 6)
    return;

  paused = true; 
  // TODO: Add input updating after lane creation
  // let laneEditingSection = createNewLane(80, 1, 200, 'kick', 3, [], [4, 4], inputKey ? inputKey : "(?)", 16);
  let canvasContainer = createNewLane(80, 1, 200, 'kick', 3, [], [4, 4], inputKey ? inputKey : "(?)", 16);

  resetLanes();
  drawLanes();
  
  // return laneEditingSection; 
  return canvasContainer; 
}
// #endsection


export function findLaneFromCanvas(canvas: HTMLCanvasElement) {
  return canvas_lane_pairs[canvas.id];
}

// TODO: Change this implementation
export function setNewPatternMeasures(measures: number) {
  newPatternMeasures = measures
}