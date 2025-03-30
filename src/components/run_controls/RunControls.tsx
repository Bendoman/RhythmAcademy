import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import PlayButton from './PlayButton';
import PauseButton from './PauseButton';
import StopButton from './StopButton';
import EditButton from './EditButton';
import Note from '../../scripts/Note.ts';
import { StatsObject } from '../../scripts/types.ts';

import '../styles/runControls.css';
import AddLaneButton from './AddLaneButton.tsx';
import { lanes, saveCurrentSessionLocally, toggleLooping } from '../../scripts/main.ts';
import NotificationsButton from './NotificationsButton.tsx';
import Lane from '../../scripts/Lane.ts';
import { saveToLocalStorage } from '../../scripts/Utils.ts';

// TODO: See if these can be reduced
interface IRunControlsProps {
    showSessionLoadScreen: boolean; 
    setSessionLoadScreen: React.Dispatch<React.SetStateAction<boolean>>;
    
    showSessionSaveScreen: boolean; 
    setSessionSaveScreen: React.Dispatch<React.SetStateAction<boolean>>;
    
    showProfileScreen: boolean; 
    setShowProfileScreen: React.Dispatch<React.SetStateAction<boolean>>;
    
    showNotificationsScreen: boolean; 
    notificationsNumber: number;
    setShowNotificationsScreen: React.Dispatch<React.SetStateAction<boolean>>;
    
    setStats: React.Dispatch<React.SetStateAction<StatsObject[]>>;
    setShowStats: React.Dispatch<React.SetStateAction<boolean>>;
}

// TODO: Refactor this name
const RunControls: React.FC<IRunControlsProps> = 
({ setShowStats, setSessionLoadScreen, setSessionSaveScreen, 
    setStats, showSessionLoadScreen, showSessionSaveScreen, 
    showProfileScreen, setShowProfileScreen, showNotificationsScreen,
    setShowNotificationsScreen, notificationsNumber }) => {
    const [looping, setLooping] = useState(false);
    const [isPaused, setIsPaused] = useState(false); 
    const [isPlaying, setIsPlaying] = useState(false);
    const [isStopped, setIsStopped] = useState(true);
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
            {/* TODO: Refactor component clicks to be void? */}
            <PlayButton 
            isPlaying={isPlaying}
            onComponentClick={() => {
                if(lanes.length > 0 && !isEditing && !isPlaying) { 
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
                if(lanes.length > 0 && !isEditing && !isPaused) {
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

            <AddLaneButton></AddLaneButton>

            <button className={`loop_button ${looping ? 'selected' : ''} `} title='Loop session'
            onClick={() => {setLooping(!looping); toggleLooping()}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-repeat2-icon lucide-repeat-2"><path d="m2 9 3-3 3 3"/><path d="M13 18H7a2 2 0 0 1-2-2V6"/><path d="m22 15-3 3-3-3"/><path d="M11 6h6a2 2 0 0 1 2 2v10"/></svg>
            </button>
            
            <div className="middle_buttons">
                <button id="save_workspace_button" title='save workspace'
                onClick={() => { setSessionSaveScreen(!showSessionSaveScreen); setSessionLoadScreen(false); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>
                </button>

                <button id="open_workspace_load_button" title='load workspace'
                onClick={() => { setSessionLoadScreen(!showSessionLoadScreen); setSessionSaveScreen(false); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scroll-text"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>
                </button>
            </div>


            <div className="bottom_buttons">
                <button id="user_button" 
                onClick={() => { setShowProfileScreen(!showProfileScreen); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-user-round-icon lucide-circle-user-round"><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></svg>   
                </button>

                <NotificationsButton 
                notificationsNumber={notificationsNumber}
                onComponentClick={() => { setShowNotificationsScreen(!showNotificationsScreen); }} 
                />

                <button id="settings_button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                
                {/* TODO: Refactor this name and change how the toggle works*/}
                <button id="lock_button"
                className={menuHover ? 'selected' : ''}
                onClick={() => {setMenuHover(!menuHover)}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left-to-line"><path d="M3 19V5"/><path d="m13 6-6 6 6 6"/><path d="M7 12h14"/></svg>
                </button>
            </div>
        </div>
    </div>
    </>)
}

export default RunControls
