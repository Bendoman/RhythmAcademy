import React, { useEffect, useState } from 'react'
import { findLaneFromCanvas, retrieveBucketList, drawSingleLane, changeEditMode } from '../scripts/main'
import Lane from '../scripts/Lane';
import { EDIT_MODES } from '../scripts/constants';

interface ILaneEditingPanelProps {
  canvas: HTMLCanvasElement;
}

const LaneEditingPanel: React.FC<ILaneEditingPanelProps> = ({ canvas }) => {
  const [editMode, setEditMode] = useState("individual");
  
  const onIndividualModeClick = () => {
    if(editMode == 'individual')
      return; 

    setEditMode('individual');
    changeEditMode(EDIT_MODES.NOTE_MODE);
  }

  const onPatternModeClick = () => {
    if(editMode == 'pattern')
      return; 

    setEditMode('pattern');
    changeEditMode(EDIT_MODES.PATTERN_MODE);
  }

  const onPatternCreationClick = () => {
    if(editMode == 'pattern_creation')
      return;

    setEditMode('pattern_creation');
    changeEditMode(EDIT_MODES.CREATE_PATTERN_MODE);
  }

  let lane: Lane; 
  useEffect(() => {
    if(canvas) {
      lane = findLaneFromCanvas(canvas);
      console.log(lane);
    } else { console.error("No canavs found"); }
  }, []);

  return (
  <div className='lane_editing'>
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
      <button className="metronome_button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-list-music"><path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/></svg>
      </button>
      <label className="metronome_label">Metronome <b>(disabled)</b></label>
    </div>
    
    <div className="bpm_container">
      <input className="bpm_input" type="number" min="1"/>
      <label>BPM</label>
    </div>
    
    <div className="measure_count_container">
      <input className="measure_count_input" type="number" min="1"/>
      <label>measure count</label>
      <button className="loop_button">loop</button>
    </div>

    <div className="precisioun_container">
        <select className="precision_select">
            <option value="16" selected>1/16</option>
            <option value="8">1/8</option>
            <option value="4">1/4</option>
        </select>
        <label htmlFor="precision_select">Hit precision</label>
    </div>

    <div className="time_signature_container">
      <select className="time_signature_select">
          <option value="4/4">4/4</option>
          <option value="2/4">2/4</option>
          <option value="3/4">3/4</option>
          <option value="6/8">6/8</option>
      </select>
      <label htmlFor="lane_sound_select">Time signature</label>
    </div>

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
      <select className="lane_sound_select">
          <option value="kick">kick</option>
          <option value="snare">snare</option>
          <option value="clap">clap</option>
          <option value="crash">crash</option>
          <option value="open-hihat">open-hihat</option>
          <option value="closed-hihat">closed-hihat</option>
      </select>
      <label htmlFor="lane_sound_select">Lane sound</label>
    </div>

    {/* TODO: Ctrl + z | ctrl + y implementation */}
    <button className="clear_notes">clear notes</button>
    <button className="back_to_start">back to start</button>

    <div className={`pattern_loading_container ${editMode == 'pattern' ? 'visible' : ''}`}>
      <select className="load_pattern_select"/>
      <div> 
          <button className="load_pattern">Add pattern</button>
          <input className="loaded_pattern_measures" type="number" min="1" value="1"></input>
          <label htmlFor="loaded_pattern_measures">measures</label>
      </div>
      
      <button className="create_pattern" onClick={onPatternCreationClick}>Create note pattern</button>
    </div>

    <div className={`pattern_creation_container ${editMode == 'pattern_creation' ? 'visible' : ''}`}>
      <div className="new_pattern_measures_container">
          <input type="number" className="new_pattern_measures" min="1" value="1"></input> 
          <label htmlFor="new_pattern_measures">Pattern measures</label>
      </div>

      <input type="text" className="pattern_name" placeholder="pattern name"></input>
      <button className="save_pattern">Save note pattern</button>
      <button className="close_pattern" onClick={onPatternModeClick}>Close pattern</button>
    </div>

    <div className="lane_loading_container">
      <select className="load_lane_select">
      </select>
      <div className="load_lane_buttons"> 
          <input type="text" className="lane_name" placeholder="lane name"></input>
          <button className="save_lane">Save lane</button>
          <button className="load_lane">Load lane</button>
      </div>
    </div>


    <button className="close">close</button>
    <p className="tootltip">right click to delete note</p>
    <button className="delete_button">Delete lane</button>

  </div>
  )
}

export default LaneEditingPanel