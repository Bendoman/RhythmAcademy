import Lane from '../scripts/Lane';
import Note from '../scripts/Note.ts';
import { EDIT_MODES } from '../scripts/constants';
import { supabase } from '../scripts/supa-client.ts';
import React, { useContext, useEffect, useRef, useState } from 'react'

// TODO: Reduce the number of imports here. There must be a cleaner way.
import { deleteLane, resetLanesEditingStatus, updateAllLaneSizes, retrieveBucketData, patternInCreationPositions, uploadToBucket, findLaneFromCanvas, retrieveBucketList, drawSingleLane, changeEditMode, maxMeasureCount, resetPatternInCreation, setNewPatternMeasures, longest_lane, setLongestLane, lanes, remapLane, saveCurrentSessionLocally } from '../scripts/main'
import PatternEditingPanel from './PatternEditingPanel.tsx';

// TODO: HUGE REFACTOR OF ALL OF THIS NEEDED
interface ILaneEditingPanelProps {
  canvas: HTMLCanvasElement;
}

const LaneEditingPanel: React.FC<ILaneEditingPanelProps> = ({ canvas }) => { 
  const lane: Lane = findLaneFromCanvas(canvas);

  // #region ( REFS )
  const laneEditingRef = useRef<HTMLDivElement | null>(null); 
  const saveLaneNameRef = useRef<HTMLInputElement | null>(null);
  const newPatternNameRef = useRef<HTMLInputElement | null>(null);
  const loadLaneSelectRef = useRef<HTMLSelectElement | null>(null);
  const newPatternMeasuresRef = useRef<HTMLInputElement | null>(null);
  const loadPatternSelectRef = useRef<HTMLSelectElement | null>(null);
  const loadPatternMeasuresRef = useRef<HTMLInputElement | null>(null);
  const keyAliasRef = useRef<HTMLInputElement | null>(null);
  const wrongNotesInputRef = useRef<HTMLInputElement | null>(null);
  
  const [showSaveBubble, setShowSaveBubble] = useState(false);

  // #endregion

  // #region ( STATE )
  const [key, setKey] = useState(0);

  const [repeated, setRepeated] = useState(false);
  const [canRepeat, setCanRepeat] = useState(false);
  
  const [editMode, setEditMode] = useState("individual");
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);

  const [noFail, setNoFail] = useState(false); 
  
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  // #endregion

  useEffect(() => {
    // Populates list of loadable lanes
    getSavedLanes(); 
    console.log(lane.maxWrongNotes);
    setNoFail(lane.noFail); 

    if(!laneEditingRef.current)
      return; 

    // Observer for redetermining if lane can be repeated when active class is added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Watches for class attribute mutations
        if(mutation.type === 'attributes' && mutation.attributeName === 'class') {
          let canRepeat = lane.getRatio() < longest_lane.getRatio();
          setCanRepeat(canRepeat);
          // Updates UI based on current lane repeated status 
          if(!lane.repeated)
            setRepeated(false);
        }
      })      
    });

    observer.observe(laneEditingRef.current, {
      attributes: true, 
      attributeFilter: ['class'],
    }); 

    // Disconnects observer on dismount 
    return () => observer.disconnect(); 
  }, [key]);

  // TODO: Move all those like this to util function
  const getSavedLanes = async () => {
    if(!loadLaneSelectRef.current || !saveLaneNameRef.current)
      return;

    let patternSelectInnerHTML = '';
    let data = await retrieveBucketList('lanes');
    data?.forEach((lane) => {
      patternSelectInnerHTML += 
      `<option value="${lane.name}" 
      ${saveLaneNameRef.current?.value == lane.name ? 'selected' : ''}>
      ${lane.name}
      </option>`;
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

  const [loadedPatterns, setLoadedPatterns] = useState<string[]>([]); 

  const onPatternModeClick = async () => {
    if(editMode == 'pattern')
      return; 

    // TODO: Keep next measure index updated while adding notes in individual mode so this isn't necessary
    // lane.notes = [];

    setEditMode('pattern');
    changeEditMode(EDIT_MODES.PATTERN_MODE);


    if(lane.repeated) {
      lane.unrepeatNotes();
      setRepeated(false); 
    }


    // TODO: Keep local list to be updated, do not retrieve it every time.
    // TODO: Move these data retrieval functions out of script
    let data = await retrieveBucketList('patterns', lane.subdivision.toString());
    console.log(data); 
    let patternSelectInnerHTML = '';
    
    let patterns: string[] = [];
    data?.forEach((pattern) => {
      patterns.push(pattern.name); 
      patternSelectInnerHTML += `<option value="${pattern.name}" ${selectedPattern == pattern.name ? 'selected' : ''}>${pattern.name}</>`;
    });
    setLoadedPatterns(patterns); 

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
    let newMC = value < maxMeasureCount ? value : maxMeasureCount;
    
    lane.measureCount = newMC;
    event.target.value = newMC.toString(); 
    
    // lane.patternStartMeasure = 0;

    if(newMC - 1 < lane.patternStartMeasure)
      lane.setPatternStartMeasure(newMC); 
       
    lane.recalculateHeight();
    lane.cullOutOfBoundsNotes();

    if(lane.repeated) {
      lane.unrepeatNotes();
      setRepeated(false);
    }

    // If the user is scrolled past the top of the lane, reset their view
    if(-lane.translationAmount < lane.calculateTopOfLane(false))
      lane.translationAmount = -lane.calculateTopOfLane(false);

    setLongestLane();
    if(lane == longest_lane) {
      lanes.forEach(lane => {
        if(lane.repeated) {
          lane.unrepeatNotes();
        }
      });
    }

    setCanRepeat(lane.getRatio() < longest_lane.getRatio()); 
    saveCurrentSessionLocally();
    drawSingleLane(lane);
  }

  const onRepeatClick = () => {
    if(!repeated) {
      // if(lane.notes.length > 0) 
      lane.repeatNotes();
    } else {
      // Lane has already been repeated. Toggle repeating off
      lane.unrepeatNotes();   
    }
    
    drawSingleLane(lane); 
    setRepeated(!repeated);
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

    // TODO: Include subdivisions here.
    let content = JSON.stringify({measures: patternMeasures, notePositions: patternInCreationPositions});
    await uploadToBucket('patterns', `${data.user.id}/${lane.subdivision}/${patternName}`, patternName, content);

    let bucketList = await retrieveBucketList('patterns');
    let patternSelectInnerHTML = '';
    bucketList?.forEach((pattern) => {
      patternSelectInnerHTML += `<option value="${pattern.name}"}>${pattern.name}</>`;
    });
    if(loadPatternSelectRef.current)
      loadPatternSelectRef.current.innerHTML = patternSelectInnerHTML;

    setSelectedPattern(patternName);

    setShowSaveBubble(true);
    setTimeout(() => setShowSaveBubble(false), 1500); // hide after 1.5s
    // TODO: Add visual feedback that save was successful
  }

  const onSaveLaneClick = async () => {
    const { data, error } = await supabase.auth.getUser();

    if(!data.user || !saveLaneNameRef.current || !saveLaneNameRef.current.value)
      return; 
    let laneName = saveLaneNameRef.current.value;

    // TODO: Disallow repeated notes from being saved here
    let repeatReverted = false;
    if(lane.repeated) {
      lane.unrepeatNotes(); 
      repeatReverted = true; 
    }

    let content = JSON.stringify({lane: lane, name: laneName})
    await uploadToBucket('lanes', `${data.user.id}/${laneName}`, laneName, content);
    
    if(repeatReverted)
      lane.repeatNotes(); 

    getSavedLanes();
  }

  const onLoadLaneClick = async () => {
    // TODO: Extract all like this out of individual listeners
    const { data, error } = await supabase.auth.getUser();
    if(!data.user || !loadLaneSelectRef.current)
      return; 

    let newLaneName = loadLaneSelectRef.current.value; 
    let laneData = await retrieveBucketData('lanes', `${data.user.id}/${newLaneName}`);

    remapLane(lane, laneData.lane);
    setCanRepeat(lane.getRatio() < longest_lane.getRatio()); 
    setRepeated(false); 
    
    // TODO: Work around using key
    setKey(key + 1);  
  }

  if (lane) return (
  <div key={key} ref={laneEditingRef} className={`lane_editing ${canvas.classList.contains('editing') ? 'activated' : ''}`}>
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
        <button className={`metronome_button ${lane.metronomeEnabled ? 'selected' : ''}`} 
        onClick={()=>{
          lane.metronomeEnabled = !lane.metronomeEnabled;
          setMetronomeEnabled(!metronomeEnabled);
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-music"><path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/></svg>
        </button>
        <label className="metronome_label">Metronome <b>({lane.metronomeEnabled ? 'enabled' : 'disabled'})</b></label>
      </div>
      
      {/* TODO: Bpm increment for all lanes */}
      <div className="bpm_container">
        <input className="bpm_input" type="number" 
        onChange={(event)=>{
          lane.bpm = parseInt(event.target.value);
          setLongestLane(); 

          if(lane.repeated) {
            lane.unrepeatNotes(); 
            setRepeated(false);
            setCanRepeat(false); 
            drawSingleLane(lane); 
          }

          setCanRepeat(lane.getRatio() < longest_lane.getRatio());

          if(lane == longest_lane) {
            lanes.forEach(lane => {
              if(lane.repeated) {
                lane.unrepeatNotes();
              }
            });
          }
        }} 
        defaultValue={lane.bpm} min="1"/>
        <label>BPM</label>
      </div>

      <div className="measure_count_container">
        <input className="measure_count_input" type="number" defaultValue={lane.measureCount} min="1"
        onChange={onMeasureCountChange}/>
        <label>measure count</label>
        
        { editMode == 'individual' && 
        <>
        <button className={`repeat_button ${repeated ? 'selected' : ''}`} disabled={!canRepeat ? true : false} onClick={onRepeatClick}>repeat</button>
        
        <button className="repeat_question" title="Repeats the notes in this lane up until the height of the longest lane in the session">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-help-icon lucide-circle-help"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
        </button>
        </>
        }
      </div>

    { editMode == 'individual' && <>

      <div className="wrong_notes_container">
        <label>Misses allowed</label>

        <div>
          <input disabled={noFail} ref={wrongNotesInputRef} type="number" className="wrong_notes_input" defaultValue={lane.maxWrongNotes} min={1} onChange={(e) => {
            lane.maxWrongNotes = parseInt(e.target.value); 
            saveCurrentSessionLocally(); 
          }} />
          <button className={`noFail_button ${noFail ? 'selected' : ''}`} onClick={() => {
            setNoFail(!noFail); 
            lane.noFail = !lane.noFail; 
            console.log(lane.noFail)
            saveCurrentSessionLocally(); 
          }}>no fail</button>
        </div>
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

      <div className="subdivision_container">
        <select className="subdivision_select"        
        onChange={(event)=>{
            // TODO: Add coming soon question mark here
            // TODO: IMPORTANT, actually figure out how time signatures will work
            let newValue = parseInt(event.target.value);
            lane.subdivision = newValue;
            lane.notes = [];
            // lane.patternStartMeasure = 0; 
            lane.setPatternStartMeasure(0); 
            lane.translationAmount = 0;
            // TODO: Review this
            lane.recalculateNoteGap(); 
            lane.recalculateHeight();
            drawSingleLane(lane);
            saveCurrentSessionLocally();
          }}>
            <option value="2" selected={(lane.subdivision == 2) ? true : false}>2</option>
            <option value="3" selected={(lane.subdivision == 3) ? true : false}>3</option>
            <option value="4" selected={(lane.subdivision == 4) ? true : false}>4</option>
            <option value="5" selected={(lane.subdivision == 5) ? true : false}>5</option>
            <option value="6" selected={(lane.subdivision == 6) ? true : false}>6</option>
            <option value="7" selected={(lane.subdivision == 7) ? true : false}>7</option>
            <option value="8" selected={(lane.subdivision == 8) ? true : false}>8</option>
            <option value="9" selected={(lane.subdivision == 9) ? true : false}>9</option>
            <option value="10" selected={(lane.subdivision == 10) ? true : false}>10</option>
            <option value="11" selected={(lane.subdivision == 11) ? true : false}>11</option>
            <option value="16" selected={(lane.subdivision == 16) ? true : false}>16</option>
        </select>
        <label htmlFor="subdivision_select">Subdivision</label>
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

      <div className="key_alias_container">
        <input type="text" ref={keyAliasRef}/>
        <button onClick={() => {
          let value = keyAliasRef.current?.value;
          if(value) lane.keyAlias = value; 
        }}>Add alias</button>
        <button onClick={() => {
          lane.keyAlias = null; 
          if(keyAliasRef.current){ keyAliasRef.current.value='' }
          }}>Remove alias</button>
      </div>
    </>}

    { editMode == 'pattern' && <>    
    </>}


    <div className={`pattern_loading_container ${editMode == 'pattern' ? 'visible' : ''}`}>
      {/* <select ref={loadPatternSelectRef} className="load_pattern_select" 
      onChange={(event)=>{setSelectedPattern(event.target.value)}}/>
      <div> 
          <button className="load_pattern" onClick={loadPatternClick}>Add pattern</button>
          <input ref={loadPatternMeasuresRef} className="loaded_pattern_measures" type="number" min="1" defaultValue="1"></input>
          <label htmlFor="loaded_pattern_measures">measures</label>
      </div> */}

      {/* TODO: Change this obviously  */}
      <PatternEditingPanel lane={lane} patterns={loadedPatterns} visible={editMode == 'pattern'} setEditMode={setEditMode}/>

      <button className="create_pattern" onClick={onPatternCreationClick}>Create new note pattern</button>
    </div>


    { editMode == 'pattern_creation' && <>
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
        {showSaveBubble && ( <div className="confirmation_popup">Pattern saved</div> )}
      </button>

      <button className="close_pattern" onClick={()=>{
        resetPatternInCreation();
        onPatternModeClick();
      }}>Close pattern</button>
    </div>
    </>}

    {/* TODO: Ctrl + z | ctrl + y implementation */}
    <button className="clear_notes" onClick={()=>{
      // TODO: Move this to own function
      if(editMode == "pattern_creation") {
        resetPatternInCreation();
      } else {
        lane.notes = [];
        // lane.patternStartMeasure = 0; 
        lane.setPatternStartMeasure(0); 
      }
      lane.translationAmount = 0; 
      drawSingleLane(lane);
      saveCurrentSessionLocally(); 
    }}>clear notes</button>

    <button className="back_to_start" onClick={()=>{
      lane.translationAmount = 0;
      drawSingleLane(lane);
    }}>back to start</button>

    <div className="lane_loading_container">
      <select ref={loadLaneSelectRef} className="load_lane_select">
      </select>
      <div className="load_lane_buttons"> 
          <input ref={saveLaneNameRef} type="text" className="lane_name" placeholder="lane name"></input>
          <button className="save_lane" onClick={onSaveLaneClick}>Save lane</button>
          <button className="load_lane" onClick={onLoadLaneClick}>Load lane</button>
      </div>
    </div>

    <button className="close" onClick={() => {
      resetLanesEditingStatus(); 
      saveCurrentSessionLocally(); 
    }}>close</button>
    <p className="tootltip">right click to delete note</p>
    <button className="delete_button" onClick={()=>{
      if(lane == longest_lane) {
        lanes.forEach(lane => {
          if(lane.repeated) {
            lane.unrepeatNotes();
          }
        });
      }
      
      deleteLane(lane, canvas); 
      setLongestLane();
      
      if(lanes.length == 0) 
        (document.querySelector('#edit_mode_button') as HTMLElement)?.click();

      saveCurrentSessionLocally();
    }}>Delete lane</button>
  </div>
  )
}

export default LaneEditingPanel