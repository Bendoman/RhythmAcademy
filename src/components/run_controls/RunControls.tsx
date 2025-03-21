import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import PlayButton from './PlayButton';
import PauseButton from './PauseButton';
import StopButton from './StopButton';
import EditButton from './EditButton';
import AddLaneButton, { AddLaneButtonRef } from './AddLaneButton.tsx';
import Note from '../../scripts/Note.ts';
import { StatsObject } from '../../scripts/types.ts';

import '../styles/runControls.css';

export interface RunControlsRef {
    processMidiMessage: (input: MIDIMessageEvent) => void; 
}

interface RunControlsProps {
    setShowStats: React.Dispatch<React.SetStateAction<boolean>>;
    setSessionLoadScreen: React.Dispatch<React.SetStateAction<boolean>>;
    setSessionSaveScreen: React.Dispatch<React.SetStateAction<boolean>>;
    showSessionLoadScreen: boolean; 
    showSessionSaveScreen: boolean; 
    setStats: React.Dispatch<React.SetStateAction<StatsObject[]>>;
}

// TODO: Refactor this name
const RunControls = forwardRef<RunControlsRef, RunControlsProps>(
    ({ setShowStats, setSessionLoadScreen, setSessionSaveScreen, setStats, 
        showSessionLoadScreen, showSessionSaveScreen }, ref) => {
    const addLaneButtonRef = useRef<AddLaneButtonRef | null>(null);

    const processMidiMessage = (input: MIDIMessageEvent) => {    
        if(addLaneButtonRef.current) 
            addLaneButtonRef.current.processMidiMessage(input);
    }; useImperativeHandle(ref, () => ({ processMidiMessage, }));


    const [isPaused, setIsPaused] = useState(true); 
    const [isPlaying, setIsPlaying] = useState(false);
    const [isStopped, setIsStopped] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    // TODO: Refactor this name
    const [menuHover, setMenuHover] = useState(false);

    return (
    <>
    {/* TODO: Add smooth transition to width here instead of in css file */}
    <div id="run_controls" className={menuHover ? 'active' : ''} 
    onMouseEnter={()=>{}}
    onMouseLeave={()=>{}}
    style={{}}
    >
        {/* TODO: Add titles to all these buttons */}
        <div id="button_container" className={menuHover ? 'active' : ''}>
            {/* Should these be their own components? */}
            <PlayButton 
            isPlaying={isPlaying}
            onComponentClick={() => {
                if(!isEditing && !isPlaying) { 
                    setIsPlaying(true); 
                    setIsPaused(false);
                    setIsStopped(false);
                    setShowStats(false);
                    return true; 
                } else return false; 
            }}></PlayButton>

            <PauseButton 
            isPaused={isPaused}
            onComponentClick={() => {
                if(!isEditing && !isPaused) {
                    setIsPaused(true);
                    setIsPlaying(false);
                    setIsStopped(false);
                    setShowStats(false);
                    return true;
                } else return false;
            }}></PauseButton>

            <StopButton 
            setStats={setStats}
            isStopped={isStopped}
            onComponentClick={() => {
                if(isPlaying || isPaused) {
                    setIsStopped(true);
                    setIsPlaying(false);
                    setIsPaused(false);
                    // TODO: Change when this shows up or have seperate button for resetting run
                    setShowStats(true);
                    return true;
                } else return false;
            }}></StopButton>

            <EditButton 
            isEditing={isEditing}
            onComponentClick={() => {
                if(!isPlaying) {
                    setIsEditing(!isEditing);
                    setIsPlaying(false);
                    setIsStopped(false);
                    setIsPaused(false);
                    setShowStats(false);
                    return true;
                } else return false;
            }}></EditButton>

            <AddLaneButton ref={addLaneButtonRef}></AddLaneButton>
            
            <div className="middle_buttons">
                <button id="save_workspace_button" title='save workspace'
                onClick={() => { setSessionSaveScreen(!showSessionSaveScreen); setSessionLoadScreen(false); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-save"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>
                </button>

                <button id="open_workspace_load_button" title='load workspace'
                onClick={() => { setSessionLoadScreen(!showSessionLoadScreen); setSessionSaveScreen(false); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-scroll-text"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>
                </button>
            </div>


            <div className="bottom_buttons">
                <button id="settings_button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                
                {/* TODO: Refactor this name and change how the toggle works*/}
                <button id="lock_button"
                className={menuHover ? 'selected' : ''}
                onClick={() => {setMenuHover(!menuHover)}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-left-to-line"><path d="M3 19V5"/><path d="m13 6-6 6 6 6"/><path d="M7 12h14"/></svg>
                </button>
            </div>
        </div>
    </div>
    </>)
})

export default RunControls
