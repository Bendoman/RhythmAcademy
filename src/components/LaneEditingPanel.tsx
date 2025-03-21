import React, { useContext, useEffect, useRef, useState } from 'react'
// TODO: Reduce the number of imports here. There must be a cleaner way.
import { deleteLane, resetLanesEditingStatus, updateAllLaneSizes, retrieveBucketData, patternInCreationPositions, uploadToBucket, findLaneFromCanvas, retrieveBucketList, drawSingleLane, changeEditMode, maxMeasureCount, resetPatternInCreation, setNewPatternMeasures } from '../scripts/main'
import Lane from '../scripts/Lane';
import { EDIT_MODES } from '../scripts/constants';
import { supabase } from '../scripts/supa-client.ts';
import { UserContext } from './App.tsx';
import Note from '../scripts/Note.ts';

// TODO: HUGE REFACTOR OF ALL OF THIS NEEDED
// TODO: Add in correct selection of hit precision, time signature and lane sound selects.
interface ILaneEditingPanelProps {
  canvas: HTMLCanvasElement;
  unmount: () => void; 
}

// TODO: See if unmount is necessary
const LaneEditingPanel: React.FC<ILaneEditingPanelProps> = ({ canvas, unmount }) => { 
  const lane: Lane = findLaneFromCanvas(canvas);
  // TODO: Improve these names
  const newPatternNameRef = useRef<HTMLInputElement | null>(null);
  const newPatternMeasuresRef = useRef<HTMLInputElement | null>(null);
  const loadPatternSelectRef = useRef<HTMLSelectElement | null>(null);
  const loadPatternMeasuresRef = useRef<HTMLInputElement | null>(null);
  const loadLaneSelectRef = useRef<HTMLSelectElement | null>(null);
  const saveLaneNameRef = useRef<HTMLInputElement | null>(null);

  const [editMode, setEditMode] = useState("individual");
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  // TODO: Change looping system
  const [looped, setLooped] = useState(false);
  const [canLoop, setCanLoop] = useState(false);

  const [key, setKey] = useState(0);

  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [selectedLane, setSelectedLane] = useState<string | null>(null);

  useEffect(() => {
    setCanLoop(maxMeasureCount % lane.measureCount == 0 ? true : false);
    console.log(maxMeasureCount % lane.measureCount == 0);
    getSavedLanes(); 

    // TODO: Have user as a ref, set it here with async function
  }, [key]);

  // TODO: Move all those like this to util function
  const getSavedLanes = async () => {
    if(!loadLaneSelectRef.current || !saveLaneNameRef.current)
      return;

    let data = await retrieveBucketList('lanes');
    let patternSelectInnerHTML = '';
    data?.forEach((lane) => {
      patternSelectInnerHTML += `<option value="${lane.name}" ${saveLaneNameRef.current?.value == lane.name ? 'selected' : ''}>${lane.name}</>`;
    });

    loadLaneSelectRef.current.innerHTML = patternSelectInnerHTML;
  }

  const onIndividualModeClick = () => {
    if(editMode == 'individual')
      return; 

    setEditMode('individual');
    changeEditMode(EDIT_MODES.NOTE_MODE);

    lane.translationAmount = 0;
    drawSingleLane(lane);
  }

  const onPatternModeClick = async () => {
    if(editMode == 'pattern')
      return; 

    lane.notes = [];

    setEditMode('pattern');
    changeEditMode(EDIT_MODES.PATTERN_MODE);
    console.log(selectedPattern);

    // TODO: Keep local list to be updated, do not retrieve it every time.
    // TODO: Move these data retrieval functions out of script
    let data = await retrieveBucketList('patterns');
    let patternSelectInnerHTML = '';
    data?.forEach((pattern) => {
      patternSelectInnerHTML += `<option value="${pattern.name}" ${selectedPattern == pattern.name ? 'selected' : ''}>${pattern.name}</>`;
    });
    if(loadPatternSelectRef.current)
      loadPatternSelectRef.current.innerHTML = patternSelectInnerHTML;

    lane.translationAmount = 0;
    drawSingleLane(lane);
  }

  const onPatternCreationClick = async () => {
    if(editMode == 'pattern_creation')
      return;

    setEditMode('pattern_creation');
    changeEditMode(EDIT_MODES.CREATE_PATTERN_MODE);

    lane.translationAmount = 0;
    drawSingleLane(lane);
  }

  const onMeasureCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(event.target.value);
    // TODO: Update how the max measure system works.
    let newMC = value < maxMeasureCount ? value : maxMeasureCount;
    
    lane.measureCount = newMC;
    event.target.value = newMC.toString(); 
    
    // TODO: Add ability to keep notes before measure cut off. 
    lane.patternStartMeasure = 0;
    lane.notes = [];
    lane.recalculateHeight();
    lane.translationAmount = 0; 

    // TODO: Deal with potential bug with looping when measures change
    if(newMC != maxMeasureCount && maxMeasureCount % newMC == 0)
      setCanLoop(true);
    else 
      setCanLoop(false);

    drawSingleLane(lane);
  }

  const onLoopClick = () => {
    if(!looped) {
      // Toggle looping on
      lane.looped = true;
      
      let loops = maxMeasureCount / lane.measureCount; 
      if(lane.notes.length > 0) 
        lane.loopNotes(loops);
      
      lane.loopedHeight = lane.calculateHeight(true); 
      lane.topOfLane = lane.calculateTopOfLane(true);
    } else {
      // Lane has already been looped. Toggle looping off
      lane.notes.splice(lane.notes.length - lane.loopedNotes, lane.loopedNotes);
      lane.looped = false; 
      lane.loopedNotes = 0; 
      
      // TODO: DETERMINE IF THIS IS NECESSARY. TEST CASES OF LOOPING BEING TURNED OFF
      // lane.loopedHeight = lane.calculateHeight(false);      
    }
    
    drawSingleLane(lane); 
    setLooped(!looped);
  }

  const loadPatternClick = async () => {
    const { data, error } = await supabase.auth.getUser();
    if(!loadPatternSelectRef.current || !loadPatternMeasuresRef.current || !data.user)
      return; 

    let patternData = await retrieveBucketData('patterns', `${data.user.id}/${loadPatternSelectRef.current.value}`)

    lane.loadPattern(patternData, parseInt(loadPatternMeasuresRef.current.value));
    drawSingleLane(lane);
  }

  async function onSavePatternClick() {
    // TODO: Include local storage saving also for logged out users.
    const { data, error } = await supabase.auth.getUser();

    if(!data || !data.user || !newPatternNameRef.current || !newPatternMeasuresRef.current)
      return;   

    let patternName = newPatternNameRef.current.value;
    let patternMeasures = parseInt(newPatternMeasuresRef.current.value);
    console.log(patternName, patternMeasures);


    let content = JSON.stringify({measures: patternMeasures, notePositions: patternInCreationPositions});
    await uploadToBucket('patterns', `${data.user.id}/${patternName}`, patternName, content);


    let bucketList = await retrieveBucketList('patterns');
    let patternSelectInnerHTML = '';
    bucketList?.forEach((pattern) => {
      patternSelectInnerHTML += `<option value="${pattern.name}"}>${pattern.name}</>`;
    });
    if(loadPatternSelectRef.current)
      loadPatternSelectRef.current.innerHTML = patternSelectInnerHTML;

    setSelectedPattern(patternName);
    // TODO: Add visual feedback that save was successful
  }

  const onSaveLaneClick = async () => {
    const { data, error } = await supabase.auth.getUser();

    if(!data.user || !saveLaneNameRef.current || !saveLaneNameRef.current.value)
      return; 
    let laneName = saveLaneNameRef.current.value;
    let content = JSON.stringify({lane: lane, name: laneName})
    await uploadToBucket('lanes', `${data.user.id}/${laneName}`, laneName, content);
    
    getSavedLanes();
  }

  const onLoadLaneClick = async () => {
    // TODO: Extract all like this out of individual listeners
    const { data, error } = await supabase.auth.getUser();
    if(!data.user || !loadLaneSelectRef.current)
      return; 

    let newLaneName = loadLaneSelectRef.current.value; 
    let laneData = await retrieveBucketData('lanes', `${data.user.id}/${newLaneName}`);
    let newLane: Lane = laneData.lane; 

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
      console.log(note);
      // TODO Change to new note with index constructor
      lane.notes.push(new Note(note.index));   
    })
    lane.hitzone = lane.calculateHitzone(); 
    lane.recalculateHeight(); 
    
    updateAllLaneSizes();
    lane.handleResize();
    drawSingleLane(lane); 

    // TODO: Work around using key
    setKey(key + 1);  
  }

  const onCloseClick = () => {
    resetLanesEditingStatus();
  }

  if (lane) return (
  // TODO: Try to work around having to use key to remount
  <div key={key} className={`lane_editing ${canvas.classList.contains('editing') ? 'activated' : ''}`}>
    <div className='edit_mode_container'>
      <button 
      className={`edit_mode_button note_mode_button ${editMode == 'individual' ? 'selected' : ''}`}
      onClick={onIndividualModeClick}>Individual note placement</button>

      <button 
      className={`edit_mode_button pattern_mode_button 
        ${editMode == 'pattern' || editMode == 'pattern_creation' ? 'selected' : ''}`} 
      onClick={onPatternModeClick}>Pattern mode</button>
    </div>


    <div className="metronome_container">
      <button className={`metronome_button ${metronomeEnabled ? 'selected' : ''}`} 
      onClick={()=>{
        lane.metronomeEnabled = !lane.metronomeEnabled;
        setMetronomeEnabled(!metronomeEnabled);
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-list-music"><path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/></svg>
      </button>
      <label className="metronome_label">Metronome <b>({metronomeEnabled ? 'enabled' : 'disabled'})</b></label>
    </div>
    
    <div className="bpm_container">
      <input className="bpm_input" type="number" 
      onChange={(event)=>{lane.bpm = parseInt(event.target.value);}} 
      defaultValue={lane.bpm} min="1"/>
      <label>BPM</label>
    </div>
    
    <div className="measure_count_container">
      <input className="measure_count_input" type="number" defaultValue={lane.measureCount} min="1"
      onChange={onMeasureCountChange}/>
      <label>measure count</label>
      <button disabled={!canLoop ? true : false} className={`loop_button ${looped ? 'selected' : ''}`} onClick={onLoopClick}>loop</button>
    </div>

    <div className="precisioun_container">
        <select className="precision_select" 
        onChange={(event)=>{
          lane.hitPrecision = parseInt(event.target.value)
          lane.hitzone = lane.calculateHitzone();
          drawSingleLane(lane);
        }}>
            <option value="16" selected={lane.hitPrecision == 16 ? true : false}>1/16</option>
            <option value="8"  selected={lane.hitPrecision == 8 ? true : false}>1/8</option>
            <option value="4"  selected={lane.hitPrecision == 4 ? true : false}>1/4</option>
        </select>
        <label htmlFor="precision_select">Hit precision</label>
    </div>

    <div className="time_signature_container">
      <select className="time_signature_select"        
      onChange={(event)=>{
          // TODO: IMPORTANT, actually figure out how time signatures will work
          let split = event.target.value.split('/');
          lane.timeSignature = [parseInt(split[0]), parseInt(split[1])];
          lane.notes = [];
          lane.translationAmount = 0;
          // TODO: Review this
          lane.recalculateHeight();
          drawSingleLane(lane);
        }}>
          <option value="4/4" selected={(lane.timeSignature[0] == 4 && lane.timeSignature[1] == 4) ? true : false}>4/4</option>
          <option value="2/4" selected={(lane.timeSignature[0] == 2 && lane.timeSignature[1] == 4) ? true : false}>2/4</option>
          <option value="3/4" selected={(lane.timeSignature[0] == 3 && lane.timeSignature[1] == 4) ? true : false}>3/4</option>
          <option value="6/8" selected={(lane.timeSignature[0] == 6 && lane.timeSignature[1] == 8) ? true : false}>6/8</option>
      </select>
      <label htmlFor="lane_sound_select">Time signature</label>
    </div>
      
    {/* TODO: Implement this */}
    <div className="metronome_sound_container">
      <select className="metronome_select">
          <option value="metronome1" selected>1</option>
          <option value="metronome2">2</option>
          <option value="metronome3">3</option>
          <option value="metronome4">4</option>
          <option value="metronome5">5</option>
          <option value="metronome6">6</option>
      </select>
      <label htmlFor="lane_sound_select">Metronome sound</label>
    </div>

      
    <div className="lane_sound_container">
      <select className="lane_sound_select" 
      onChange={(event)=>{
        lane.hitsound = event.target.value;
      }}>
          <option value="kick"  selected={lane.hitsound == "kick" ? true : false}>kick</option>
          <option value="snare" selected={lane.hitsound == "snare" ? true : false}>snare</option>
          <option value="clap"  selected={lane.hitsound == "clap" ? true : false}>clap</option>
          <option value="crash" selected={lane.hitsound == "crash" ? true : false}>crash</option>
          <option value="open-hihat"   selected={lane.hitsound == "open-hihat" ? true : false}>open-hihat</option>
          <option value="closed-hihat" selected={lane.hitsound == "closed-hihat" ? true : false}>closed-hihat</option>
      </select>
      <label htmlFor="lane_sound_select">Lane sound</label>
    </div>

    {/* TODO: Ctrl + z | ctrl + y implementation */}
    <button className="clear_notes" onClick={()=>{
        // TODO: Move this to own function
        if(editMode == "pattern_creation") {
          resetPatternInCreation();
        } else {
          lane.notes = [];
          lane.patternStartMeasure = 0; 
        }
        lane.translationAmount = 0; 
        drawSingleLane(lane);
    }}>clear notes</button>

    <button className="back_to_start" onClick={()=>{
      lane.translationAmount = 0;
      drawSingleLane(lane);
    }}>back to start</button>

    <div className={`pattern_loading_container ${editMode == 'pattern' ? 'visible' : ''}`}>
      <select ref={loadPatternSelectRef} className="load_pattern_select" 
      onChange={(event)=>{setSelectedPattern(event.target.value)}}/>
      <div> 
          <button className="load_pattern" onClick={loadPatternClick}>Add pattern</button>
          <input ref={loadPatternMeasuresRef} className="loaded_pattern_measures" type="number" min="1" defaultValue="1"></input>
          <label htmlFor="loaded_pattern_measures">measures</label>
      </div>
      
      <button className="create_pattern" onClick={onPatternCreationClick}>Create note pattern</button>
    </div>

    <div className={`pattern_creation_container ${editMode == 'pattern_creation' ? 'visible' : ''}`}>
      <div className="new_pattern_measures_container">
          <input ref={newPatternMeasuresRef} type="number" className="new_pattern_measures" min="1" defaultValue="1"
          onChange={(event)=>{
            // TODO: Change this implementation
            setNewPatternMeasures(parseInt(event.target.value));
            drawSingleLane(lane);
          }}></input> 
          <label htmlFor="new_pattern_measures">Pattern measures</label>
      </div>

      <input ref={newPatternNameRef} type="text" className="pattern_name" placeholder="pattern name"></input>
      <button className="save_pattern" 
      onClick={onSavePatternClick}>
        Save note pattern
      </button>
      <button className="close_pattern" onClick={()=>{
        resetPatternInCreation();
        onPatternModeClick();
      }}>Close pattern</button>
    </div>

    <div className="lane_loading_container">
      <select ref={loadLaneSelectRef} className="load_lane_select">
      </select>
      <div className="load_lane_buttons"> 
          <input ref={saveLaneNameRef} type="text" className="lane_name" placeholder="lane name"></input>
          <button className="save_lane" onClick={onSaveLaneClick}>Save lane</button>
          <button className="load_lane" onClick={onLoadLaneClick}>Load lane</button>
      </div>
    </div>


    <button className="close" onClick={resetLanesEditingStatus}>close</button>
    <p className="tootltip">right click to delete note</p>
    <button className="delete_button" onClick={()=>{deleteLane(lane, canvas); unmount();}}>Delete lane</button>
  </div>
  )
}

export default LaneEditingPanel