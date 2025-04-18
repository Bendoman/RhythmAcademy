import Lane from '../../scripts/classes/Lane.ts';
import { EDIT_MODES } from '../../scripts/helpers/constants.ts';
import { supabase } from '../../scripts/helpers/supa-client.ts';
import React, { act, useEffect, useRef, useState } from 'react'

// TODO: Reduce the number of imports here. There must be a cleaner way.
import PatternEditingPanel from './PatternEditingPanel.tsx';
import { deleteLane, resetLanesEditingStatus, patternInCreationPositions,  findLaneFromCanvas, drawSingleLane, changeEditMode, maxMeasureCount, resetPatternInCreation, setNewPatternMeasures, longest_lane, setLongestLane, lanes, remapLane, saveCurrentSessionLocally, global_volume } from '../../scripts/main.ts'
import { listLocalStorageFolder, loadFromLocalStorage, saveToLocalStorage } from '../../scripts/helpers/utils.ts';
import { retrieveBucketData, retrieveBucketListWithFolders, retrievePublicBucketList, uploadToBucket } from '../../scripts/helpers/supa-utils.ts';

import '../styles/lane_editing.css';
import { AutoPlay, LeftArrowIcon, Metronome, QuestionMark, RightArrowIcon } from '../../assets/svg/Icons.tsx';

interface ILaneEditingPanelProps {
  canvas: HTMLCanvasElement;
  setShowLogo: React.Dispatch<React.SetStateAction<boolean>>; 
}

const LaneEditingPanel: React.FC<ILaneEditingPanelProps> = ({ canvas, setShowLogo }) => { 
  const lane: Lane = findLaneFromCanvas(canvas);

  // #region ( refs )
  const allBPMRef = useRef<HTMLInputElement | null>(null); 
  const keyAliasRef = useRef<HTMLInputElement | null>(null);
  const laneEditingRef = useRef<HTMLDivElement | null>(null); 
  const saveLaneNameRef = useRef<HTMLInputElement | null>(null);
  const newPatternNameRef = useRef<HTMLInputElement | null>(null);
  const wrongNotesInputRef = useRef<HTMLInputElement | null>(null);
  const loadLaneSelectRef = useRef<HTMLSelectElement | null>(null);
  const newPatternMeasuresRef = useRef<HTMLInputElement | null>(null);
  // #endregion
  
  // #region ( state )
  const [key, setKey] = useState(0);
  
  const [noFail, setNoFail] = useState(false); 
  const [repeated, setRepeated] = useState(false);
  const [canRepeat, setCanRepeat] = useState(false);

  const [autoPlayEnabled, setAutoplayEnabled] = useState(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  
  const [toolTipTab, setToolTipTab] = useState(0); 
  const [popupStatus, setPopupStatus] = useState(''); 

  const [activated, setActivated] = useState(false); 
  const [editMode, setEditMode] = useState("individual");
  const [loadedPatterns, setLoadedPatterns] = useState<string[]>([]); 
  const [patternInCreationInputs, setPatternInCreationInputs] = useState<{patternName: string, measures: number} | null>(null); 
  // #endregion

  const tooltips = [
    'right click to delete a note',
    'Use the mouse wheel to scroll up the lane',
    'Patterns can be saved while signed out',
    'Patterns are saved seperately for each subdivision',
    'Hover over most buttons to see what they do'
  ]

  const getSavedLanes = async () => {
    if(!loadLaneSelectRef.current || !saveLaneNameRef.current)
      return;

    let data; 
    let lanes: string[] = []; 
    let patternSelectInnerHTML = '';
    const userId = (await supabase.auth.getUser()).data.user?.id as string;

    if(userId) {
      // Retrieve saved lanes from Supabase
      data = await retrieveBucketListWithFolders('lanes');
      if(data) { data.forEach((lane) => {lanes.push(lane.name)}) }
    } else {
      // Retrieve saved lanes from local storage
      data = listLocalStorageFolder('lanes');
      data.forEach(laneName => {lanes.push(laneName)});
    }

    lanes.forEach((laneName) => {
      patternSelectInnerHTML += 
      `<option value="${laneName}" 
      ${saveLaneNameRef.current?.value == laneName ? 'selected' : ''}>
      ${laneName}
      </option>`;
    });

    loadLaneSelectRef.current.innerHTML = patternSelectInnerHTML;
  }

  // #region ( edit mode click handlers )
  const onIndividualModeClick = () => {
    if(editMode == 'individual') { return }

    setEditMode('individual');
    changeEditMode(EDIT_MODES.NOTE_MODE);

    lane.translationAmount = 0;
    drawSingleLane(lane);
  }

  const onPatternModeClick = async () => {
    if(editMode == 'pattern') { return }

    setEditMode('pattern');
    changeEditMode(EDIT_MODES.PATTERN_MODE);

    if(lane.repeated) {
      lane.unrepeatNotes();
      setRepeated(false); 
    }

    let patterns: string[] = [];
    // Retrieve public patterns
    let publicPatterns = await retrievePublicBucketList('public_patterns')
    if(publicPatterns) {
      publicPatterns.forEach((pattern: string) => {
        let patternSubdivision = parseInt(pattern.split('/')[0]);
        if(patternSubdivision == lane.subdivision)
          patterns.push(`public_${pattern}`); 
      });
    }

    const userId = (await supabase.auth.getUser()).data.user?.id as string;
    if(userId) {
      // Retrieve list of patterns from Supabase
      let data = await retrieveBucketListWithFolders('patterns', lane.subdivision.toString());
      if(data) { data.forEach(pattern => { patterns.push(pattern.name) }) }
    } else {
      // Retrieve list of patterns from local storage
      let data = listLocalStorageFolder('patterns');
      data.forEach(patternName => {patterns.push(patternName) });
    }
    setLoadedPatterns(patterns); 
    
    lane.translationAmount = 0;
    drawSingleLane(lane);
  }

  const onPatternCreationClick = async () => {
    if(editMode == 'pattern_creation') { return }

    setEditMode('pattern_creation');
    changeEditMode(EDIT_MODES.CREATE_PATTERN_MODE);

    lane.translationAmount = 0;
    drawSingleLane(lane);
  }
  // #endregion

  // #region ( onnchange handlers)
  const onBpmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    lane.bpm = parseInt(event.target.value);
    setLongestLane(); 

    if(lane.repeated) {
      lane.unrepeatNotes(); 
      setRepeated(false);
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
  }

  const onSetAllBPM = () => {
    if(!allBPMRef.current) { return }
    let value = parseInt(allBPMRef.current.value);
    if(!(value > 0)) { return }

    lanes.forEach(lane => {
      lane.bpm = value; 
      if(lane.repeated) { lane.unrepeatNotes() }
      lane.canvas.parentElement
      ?.querySelector('.lane_editing')
      ?.classList.add('altered');
    });

    setLongestLane(); 
    setRepeated(false);
    setCanRepeat(lane.getRatio() < longest_lane.getRatio());
    allBPMRef.current.value = "";
  }

  const onMeasureCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {    
    let value = parseInt(event.target.value);
    let oldMC = lane.measureCount; 
    let newMC = value < maxMeasureCount ? value : maxMeasureCount;
    
    lane.measureCount = newMC;
    event.target.value = newMC.toString(); 

    if(newMC - 1 < lane.patternStartMeasure)
      lane.setPatternStartMeasure(newMC); 
       
    lane.recalculateHeight();
    if(newMC < oldMC)
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
      lanes.forEach(lane => { if(lane.repeated){ lane.unrepeatNotes() }});
    }

    setCanRepeat(lane.getRatio() < longest_lane.getRatio()); 
    saveCurrentSessionLocally();
    drawSingleLane(lane);
  }

  const onSubdivisionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    let newValue = parseInt(event.target.value);
    lane.subdivision = newValue;
    lane.notes = [];

    lane.setPatternStartMeasure(0); 
    lane.translationAmount = 0;

    lane.recalculateNoteGap(); 
    lane.recalculateHeight();

    drawSingleLane(lane);
    saveCurrentSessionLocally();
  }

  // #endregion

  // #region ( click handlers )
  const onRepeatClick = () => {
    if(!lane.repeated) {
      lane.repeatNotes();
    } else {
      // Lane has already been repeated. Toggle repeating off
      lane.unrepeatNotes();   
    }
    
    drawSingleLane(lane); 
    setRepeated(!repeated);
  }
  // #endregion

  // #region ( save and load handlers )
  async function onSavePatternClick() {
    const userId = (await supabase.auth.getUser()).data.user?.id as string;

    if(!newPatternNameRef.current || !newPatternMeasuresRef.current) { return }   

    let patternName = newPatternNameRef.current.value;
    let patternMeasures = parseInt(newPatternMeasuresRef.current.value);
    let content = JSON.stringify({measures: patternMeasures, notePositions: patternInCreationPositions});
    
    
    let status = 0; 
    if(userId) {
      // Upload to Supabase
      status = await uploadToBucket('patterns', `${userId}/${lane.subdivision}/${patternName}`, patternName, content);
    } else {
      // Upload to local storage
      status = saveToLocalStorage(`patterns/${patternName}`, content);
    }
    
    if(status < 0) {
      // Error uploading
      setPopupStatus('pattern_save_error'); 
      setTimeout(() => setPopupStatus(''), 1500); 
    } else {
      // Upload successful 
      setPopupStatus('pattern_save_success');
      setTimeout(() => setPopupStatus(''), 1500); 
    }
  }

  const onSaveLaneClick = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id as string;

    if(!saveLaneNameRef.current || !saveLaneNameRef.current.value) { return }
    let laneName = saveLaneNameRef.current.value;

    // Ensures that repeated notes aren't saved
    let repeatReverted = false;
    if(lane.repeated) {
      lane.unrepeatNotes(); 
      repeatReverted = true; 
    }
    
    let status = 0; 
    let content = JSON.stringify({lane: lane, name: laneName})
    if(userId) {
      status = await uploadToBucket('lanes', `${userId}/${laneName}`, laneName, content);
    } else {
      status = saveToLocalStorage(`lanes/${laneName}`, content);
    }

    if(status < 0) {
      // Error uploading
      setPopupStatus('lane_save_error'); 
      setTimeout(() => setPopupStatus(''), 1500); 
    } else {
      // Upload successful 
      setPopupStatus('lane_save_success');
      setTimeout(() => setPopupStatus(''), 1500); 
    }
    
    getSavedLanes();
    // Reverts lane repeated status
    if(repeatReverted)
      lane.repeatNotes(); 
  }

  const onLoadLaneClick = async () => {
    if(!loadLaneSelectRef.current) { return }  
    
    let laneData;
    let laneName = loadLaneSelectRef.current.value; 
    const userId = (await supabase.auth.getUser()).data.user?.id as string;
    if(userId) {
      // Fetch from Supabase
      laneData = await retrieveBucketData('lanes', `${userId}/${laneName}`);
    } else {
      // Fetch from local storeage
      laneData = loadFromLocalStorage(`lanes/${laneName}`);
    }

    if(laneData == -1) {
      // Error fetching
      setPopupStatus('lane_load_error'); 
      setTimeout(() => setPopupStatus(''), 1500); 
    } else  {
      remapLane(lane, laneData.lane);
      setCanRepeat(lane.getRatio() < longest_lane.getRatio()); 
      setRepeated(false); 
      
      setKey(key + 1);  
    }
  }
  // #endregion

  useEffect(() => {
    getSavedLanes();
    setNoFail(lane.noFail); 

    if(!laneEditingRef.current) { return } 
    // Observer redetermines if lane can be repeated when panel is opened
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Watches for class attribute mutations
        if(mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setActivated(canvas.classList.contains('editing'));
          
          let target = mutation.target as HTMLDivElement;
          if(target.classList.contains('altered')){
            setKey(key + 1);  
          }

          let canRepeat = lane.getRatio() < longest_lane.getRatio();
          setCanRepeat(canRepeat);
          getSavedLanes();

          setMetronomeEnabled(lane.metronomeEnabled); 
          setAutoplayEnabled(lane.autoPlayEnabled); 
          // Updates UI based on current lane repeated status 
          if(!lane.repeated){ setRepeated(false) };
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

  if (lane) return (
  <div 
  key={key} ref={laneEditingRef} 
  className={`lane_editing ${canvas.classList.contains('editing') ? 'activated' : ''}`}>
    <div className="scroll_container">
    <div className='edit_mode_container'>
      <button disabled={!activated} className={`edit_mode_button note_mode_button ${editMode == 'individual' ? 'selected' : ''}`} 
      onClick={onIndividualModeClick}>Individual note placement</button>

      <button disabled={!activated} className={`edit_mode_button pattern_mode_button 
        ${editMode == 'pattern' || editMode == 'pattern_creation' ? 'selected' : ''}`} 
      onClick={onPatternModeClick}>Pattern mode</button>
    </div>

    <div className="metronome_container">
      <button className={`metronome_button ${metronomeEnabled ? 'selected' : ''}`} 
      title='Enable lane metronome'
      onClick={()=>{
        lane.metronomeEnabled = !lane.metronomeEnabled;
        setMetronomeEnabled(!metronomeEnabled);
      }}> <Metronome/> </button>

      <button disabled={!activated}
      title='Autoplays the lanes hitsound when notes enter the perfect zone. Useful for hearing timings'
      className={`autoplay_button ${autoPlayEnabled ? 'selected' : ''}`}
      onClick={()=>{
        lane.autoPlayEnabled = !lane.autoPlayEnabled;
        setAutoplayEnabled(!autoPlayEnabled);
      }}> <AutoPlay/> 
      </button>
    </div>
      
    <div className="bpm_container">
      <input disabled={!activated}
      className="bpm_input" type="number" 
      onChange={onBpmChange} 
      defaultValue={lane.bpm} min="1"/>
      <label>BPM</label>
    </div>

    <div className="bpm_container">
      <input disabled={!activated}
      className="bpm_input" type="number" 
      ref={allBPMRef}
      min="1"/>
      <button onClick={() => {
        if(allBPMRef.current) 
          onSetAllBPM();
      }}>Apply</button>
      <label>Set all lanes BPM</label>
    </div>

    <div className="measure_count_container">
      <input disabled={!activated}
      className="measure_count_input" type="number" defaultValue={lane.measureCount} min="1"
      onChange={onMeasureCountChange}/>
      <label>measure count</label>
      
      { editMode == 'individual' && 
      <> <button 
      className={`repeat_button ${lane.repeated ? 'selected' : ''}`} disabled={ !canRepeat || !activated } 
      onClick={onRepeatClick}>repeat</button>

      <QuestionMark 
      message={'Repeats the notes in this lane up until the height of the longest lane in the session'}/></>}
    </div>

    { editMode == 'individual' && <>
      <div className="wrong_notes_container">
        <input disabled={noFail || !activated} ref={wrongNotesInputRef} type="number" 
        className="wrong_notes_input" defaultValue={lane.maxWrongNotes} min={1} onChange={(e) => {
          lane.maxWrongNotes = parseInt(e.target.value); 
          saveCurrentSessionLocally(); 
        }} />
        <label>Misses allowed</label>
        
        <button disabled={!activated}
        className={`noFail_button ${noFail ? 'selected' : ''}`} onClick={() => {
          setNoFail(!noFail); 
          lane.noFail = !lane.noFail; 
          saveCurrentSessionLocally(); 
        }}>no fail</button>
      </div>

      <div className="precision_container">
          <select disabled={!activated}
          className="precision_select" 
          onChange={(event)=>{
            lane.hitPrecision = parseInt(event.target.value)
            lane.hitzone = lane.calculateHitzone();
            drawSingleLane(lane);
          }}>
              <option value="16" selected={lane.hitPrecision == 16 ? true : false}>Hard</option>
              <option value="8"  selected={lane.hitPrecision == 8 ? true : false}>Medium</option>
              <option value="4"  selected={lane.hitPrecision == 4 ? true : false}>Easy</option>
          </select>
          <label htmlFor="precision_select">Hit precision</label>
      </div>

      <div className="subdivision_container">
        <select disabled={!activated}
        className="subdivision_select"        
        onChange={onSubdivisionChange}>
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
            <option value="12" selected={(lane.subdivision == 12) ? true : false}>12</option>
            <option value="13" selected={(lane.subdivision == 13) ? true : false}>13</option>
            <option value="14" selected={(lane.subdivision == 14) ? true : false}>14</option>
            <option value="15" selected={(lane.subdivision == 15) ? true : false}>15</option>
            <option value="16" selected={(lane.subdivision == 16) ? true : false}>16</option>
        </select>
        <label htmlFor="subdivision_select">Beats per measure</label>
      </div>    

      {/* TODO: Update this for new sounds */}
      <div className="lane_sound_container">
        <select disabled={!activated}
        className="lane_sound_select" 
        onChange={(event)=>{
          lane.hitsound = event.target.value;
          lane.audioSprite.play(lane.hitsound, global_volume);
        }}>
            <option value="kick1" selected={lane.hitsound == "kick1" ? true : false}>kick 1</option>
            <option value="kick2"  selected={lane.hitsound == "kick2" ? true : false}>kick 2</option>
            <option value="kick3" selected={lane.hitsound == "kick3" ? true : false}>kick 3</option>

            <option value="snare1"  selected={lane.hitsound == "snare1" ? true : false}>snare 1</option>
            <option value="snare2" selected={lane.hitsound == "snare2" ? true : false}>snare 2</option>
            <option value="snare3"   selected={lane.hitsound == "snare3" ? true : false}>snare 3</option>

            <option value="crash" selected={lane.hitsound == "crash" ? true : false}>crash</option>
            <option value="hihatClose" selected={lane.hitsound == "hihatClose" ? true : false}>closed hihat</option>
            <option value="hihatOpen"   selected={lane.hitsound == "hihatOpen" ? true : false}>open hihat</option>

            <option value="tom" selected={lane.hitsound == "tom" ? true : false}>tom</option>
        </select>
        <label htmlFor="lane_sound_select">Lane sound</label>
      </div>

      <div className="key_alias_container">
        <input disabled={!activated} placeholder='Input key alias' className='key_alias_input' type="text" ref={keyAliasRef}/>

        <div className='key_alias_button_container'>
        <button disabled={!activated}
        onClick={() => {
          let value = keyAliasRef.current?.value;
          if(value) lane.keyAlias = value; 
        }}>Set alias</button>
        <button disabled={!activated}
        onClick={() => {
          lane.keyAlias = null; 
          if(keyAliasRef.current){ keyAliasRef.current.value='' }
          }}>Remove alias</button>

          <QuestionMark 
          message={'Set custom label for this lane\s input key'}/>
        </div>
      </div>
    </>}

    <button disabled={!activated} className="clear_notes" onClick={()=>{
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

    <button disabled={!activated} className="back_to_start" onClick={()=>{
      lane.translationAmount = 0;
      drawSingleLane(lane);
    }}>back to start</button>

    <div className={`pattern_loading_container ${editMode == 'pattern' ? 'visible' : ''}`}>
      <button disabled={!activated} 
      className="create_pattern" onClick={onPatternCreationClick}>
        Create new note pattern
      </button>

      <PatternEditingPanel lane={lane} patterns={loadedPatterns} 
      inPatternMode={editMode == 'pattern'} setEditMode={setEditMode}
      setPatternInCreationInputs={setPatternInCreationInputs} activated={activated}/>
    </div>

    { editMode == 'pattern_creation' && <>
    <div className={`pattern_creation_container ${editMode == 'pattern_creation' ? 'visible' : ''}`}>
      <div className="new_pattern_measures_container">
          <input disabled={!activated}
          ref={newPatternMeasuresRef} type="number" className="new_pattern_measures" min="1" 
          defaultValue={patternInCreationInputs ? patternInCreationInputs.measures : '1'}
          onChange={(event)=>{
            setNewPatternMeasures(parseInt(event.target.value));
            drawSingleLane(lane);
          }}></input> 
          <label htmlFor="new_pattern_measures">Pattern measures</label>
      </div>

      <input disabled={!activated} 
      ref={newPatternNameRef} type="text" className="pattern_name" placeholder="pattern name"
      defaultValue={patternInCreationInputs ? patternInCreationInputs.patternName : ''}></input>
      <button disabled={!activated} className="save_pattern"
      onClick={onSavePatternClick}>
        Save note pattern
        {popupStatus == 'pattern_save_error' && ( <div className="error_popup">Error saving</div> )}
        {popupStatus == 'pattern_save_success' && ( <div className="confirmation_popup">Pattern saved</div> )}
      </button>

      <button disabled={!activated}
       className="close_pattern" onClick={()=>{
        resetPatternInCreation();
        onPatternModeClick();
      }}>Close pattern</button>
    </div>
    </>}

    <div className="lane_loading_container">
      <select disabled={!activated}
      ref={loadLaneSelectRef} className="load_lane_select"/>
      
      <div className="load_lane_buttons"> 
          <input disabled={!activated}
          ref={saveLaneNameRef} type="text" className="lane_name" placeholder="lane name"></input>
          <button disabled={!activated}
          className="save_lane" onClick={onSaveLaneClick}>
            Save lane
            {popupStatus == 'lane_save_error' && ( <div className="error_popup">Error saving</div> )}
            {popupStatus == 'lane_save_success' && ( <div className="confirmation_popup">Lane saved</div> )}
          </button>
          
          <button disabled={!activated}
          className="load_lane" onClick={onLoadLaneClick}>
            Load lane
            {popupStatus == 'lane_load_error' && ( <div className="error_popup">Error loading lane</div> )}
          </button>
      </div>
    </div>

    <button disabled={!activated} className="close" onClick={() => {
      resetLanesEditingStatus(); 
      saveCurrentSessionLocally(); 
    }}>close</button>


    <div className="tooltips">
      <button
      disabled={toolTipTab == 0 || !activated} 
      onClick={() => {
        setToolTipTab(toolTipTab-1);
      }}>
        <LeftArrowIcon/>
      </button>

      <p className='editingToolTip'>{tooltips[toolTipTab]}</p>

      <button 
      disabled={toolTipTab == tooltips.length - 1 || !activated}
      onClick={() => {
        setToolTipTab(toolTipTab+1);
      }}>
        <RightArrowIcon/>
      </button>
    </div>

    <button disabled={!activated}
    className="delete_button" onClick={()=>{
      if(lane == longest_lane) {
        lanes.forEach(lane => {
          if(lane.repeated) {
            lane.unrepeatNotes();
          }
        });
      }
      
      deleteLane(lane, lane.canvas); 
      setLongestLane();
      
      if(lanes.length == 0) {
        (document.querySelector('#edit_mode_button') as HTMLElement)?.click();
        setShowLogo(true);
      }

      saveCurrentSessionLocally();
    }}>Delete lane</button>
    </div>
  </div>
  )
}

export default LaneEditingPanel