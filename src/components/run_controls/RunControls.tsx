import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import PlayButton from './PlayButton';
import PauseButton from './PauseButton';
import StopButton from './StopButton';
import EditButton from './EditButton';
import AddLaneButton, { AddLaneButtonRef } from './AddLaneButton.tsx';
import Note from '../../scripts/Note.ts';
import { StatsObject } from '../../scripts/types.ts';

export interface RunControlsRef {
    processMidiMessage: (input: MIDIMessageEvent) => void; 
}

interface RunControlsProps {
    setShowStats: React.Dispatch<React.SetStateAction<boolean>>;
    setStats: React.Dispatch<React.SetStateAction<StatsObject[]>>;
}

const RunControls = forwardRef<RunControlsRef, RunControlsProps>(({ setShowStats, setStats }, ref) => {
    const addLaneButtonRef = useRef<AddLaneButtonRef | null>(null);

    const processMidiMessage = (input: MIDIMessageEvent) => {    
        if(addLaneButtonRef.current) 
            addLaneButtonRef.current.processMidiMessage(input);
    }; useImperativeHandle(ref, () => ({ processMidiMessage, }));


    const [isPaused, setIsPaused] = useState(true); 
    const [isPlaying, setIsPlaying] = useState(false);
    const [isStopped, setIsStopped] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [menuHover, setMenuHover] = useState(true);

    return (
    <>
    {/* TODO: Add smooth transition to width here instead of in css file */}
    <div id="run_controls" className={menuHover ? 'active' : ''} 
    onMouseEnter={()=>{}}
    onMouseLeave={()=>{}}
    style={{}}
    >
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
                    return true;
                } else return false;
            }}></EditButton>

            <AddLaneButton ref={addLaneButtonRef}></AddLaneButton>

            <button id="settings_button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            
            <button id="lock_button"
            className={menuHover ? 'selected' : ''}
            onClick={() => {setMenuHover(!menuHover)}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </button>
        </div>
    </div>
    </>)
})

export default RunControls
