import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import PlayButton from './PlayButton';
import PauseButton from './PauseButton';
import StopButton from './StopButton';
import EditButton from './EditButton';
import Note from '../../scripts/Note.ts';
import { StatsObject } from '../../scripts/types.ts';

import '../styles/runControls.css';
import AddLaneButton from './AddLaneButton.tsx';
import { lanes, onEditButtonClick, onPauseButtonClick, onPlayButtonClick, onStopButtonClick, saveCurrentSessionLocally, toggleLooping } from '../../scripts/main.ts';
import NotificationsButton from './NotificationsButton.tsx';
import Lane from '../../scripts/Lane.ts';
import { saveToLocalStorage } from '../../scripts/Utils.ts';
import { useAppContext } from '../AppContextProvider.tsx';

const RunControls = () => {
    const {
        showStats, setShowStats,
        stats, setStats,
        showSessionLoadScreen, setSessionLoadScreen,
        showSessionSaveScreen, setSessionSaveScreen,
        showProfileScreen, setShowProfileScreen,
        showNotificationsScreen, setShowNotificationsScreen,
        notificationsNumber, setNotificationsNumber,
        showSettingsScreen, setShowSettingsScreen,
        showToolTips, setShowToolTips,
        currentSessionName, setCurrentSessionName,
        currentSessionAltered, setCurrentSessionAltered, 
        setShowSessionToolTip, isEditingRef
    } = useAppContext(); 

    const [looping, setLooping] = useState(false);
    
    const [isPaused, setIsPaused] = useState(false); 
    let isPausedRef = useRef(false); 

    const [isPlaying, setIsPlaying] = useState(false);
    let isPlayingRef = useRef(false); 
    
    const [isStopped, setIsStopped] = useState(true);
    let isStoppedRef = useRef(true); 

    const [isEditing, setIsEditing] = useState(false);

    // TODO: Refactor this name
    const [menuHover, setMenuHover] = useState(false);

    let addLaneButtonRef = useRef<HTMLButtonElement | null>(null); 
    let loopButtonRef = useRef<HTMLButtonElement | null>(null); 
    let saveButtonRef = useRef<HTMLButtonElement | null>(null); 
    let loadButtonRef = useRef<HTMLButtonElement | null>(null); 

    const closeAllScreens = () => {
        setShowStats(false);        
        setSessionSaveScreen(false); 
        setSessionLoadScreen(false);
        setShowProfileScreen(false); 
        setShowNotificationsScreen(false);    
    }

    const editButtonClick = () => {
        if(!isPlayingRef.current) {
            setCurrentSessionAltered(true); 
            saveToLocalStorage('stats', '');
            
            setCurrentSessionName('');

            setShowSessionToolTip(false); 

            isEditingRef.current = !isEditingRef.current; 
            setIsEditing(isEditingRef.current);

            setIsPlaying(false);
            isPlayingRef.current = false; 

            setIsStopped(false);
            isStoppedRef.current = false; 

            setIsPaused(false);
            isPausedRef.current = false; 

            setShowStats(false);
            onEditButtonClick();
        } 
    }

    const stopButtonClick = () => {
        console.log('in here')
        if(isPlayingRef.current || isPausedRef.current) {
            isStoppedRef.current = !isStoppedRef.current; 
            setIsStopped(isStoppedRef.current);

            setIsPlaying(false);
            isPlayingRef.current = false; 

            setIsPaused(false);
            isPausedRef.current = false; 
            
            // TODO: Change when this shows up or have seperate button for resetting run
            setShowStats(true);
            setStats(onStopButtonClick());
        } 
    }

    const pausedButtonClick = () => {
        if(lanes.length > 0 && !isEditingRef.current && !isPausedRef.current) {
            isPausedRef.current = !isPausedRef.current; 
            setIsPaused(isPausedRef.current);

            setIsPlaying(false);
            isPlayingRef.current = false; 

            setIsStopped(false);
            isStoppedRef.current = false; 

            setShowStats(false);
            onPauseButtonClick();
        } 
    }

    const playButtonClick = () => {
        if(lanes.length > 0 && !isEditingRef.current && !isPlayingRef.current) { 
            isPlayingRef.current = !isPlayingRef.current; 
            setIsPlaying(isPlayingRef.current);

            setIsPaused(false);
            isPausedRef.current = false; 

            setIsStopped(false);
            isStoppedRef.current = false; 
            
            setShowStats(false);
            onPlayButtonClick();
        } 
    }

    let controlHeld = false; 
    const handleKeyDown = (event: KeyboardEvent) => {   
        if(event.key == 'Control') {
            controlHeld = true; 
            return; 
        }

        const screenOpen = document.querySelector('div.screen') !== null;
        const currentlyEditing = document.querySelector('canvas.editing') !== null;
        // TODO: CTRL + SPACE to stop
        if(!screenOpen && !currentlyEditing && event.key == ' ') {
            event.preventDefault(); 
            if(!isPlayingRef.current)
                playButtonClick(); 
            else if(!isPausedRef.current)
                pausedButtonClick(); 
        }

        if(!screenOpen && isPausedRef.current && event.key == 'Escape')
            stopButtonClick(); 

        if(!controlHeld)
            return; 

        switch(event.key.toUpperCase()) {
            case 'E':
                if(screenOpen)
                    break;
                event.preventDefault();
                editButtonClick();
            break;
            case 'A':
                if(currentlyEditing || screenOpen) 
                    break;
                event.preventDefault(); 
                if(addLaneButtonRef.current) addLaneButtonRef.current.click(); 
            break;
            case 'L':
                event.preventDefault();
                if(loopButtonRef.current)
                    loopButtonRef.current.click();
            break;
            case 'S':
                event.preventDefault();
                if(saveButtonRef.current)
                    saveButtonRef.current.click(); 
            break;
            case 'X':
                event.preventDefault();
                if(loadButtonRef.current)
                    loadButtonRef.current.click();
            break;
        }
    };

    const handleKeyUp = (event: KeyboardEvent) => {   
        if(event.key == 'Control')
            controlHeld = false; 
    };

    useEffect(() => {
        controlHeld = false; 
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener('blur', () => {
            controlHeld = false
            if(isPlayingRef.current)
                pausedButtonClick(); 
        });
        return () => { 
            window.removeEventListener("keydown", handleKeyDown); 
            window.removeEventListener("keyup", handleKeyUp); 
        }
    }, []);

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
            <PlayButton isPlaying={isPlaying}
            onComponentClick={playButtonClick}>
            </PlayButton>

            <PauseButton isPaused={isPaused}
            onComponentClick={pausedButtonClick}>
            </PauseButton>

            <StopButton isStopped={isStopped}
            onComponentClick={stopButtonClick}>
            </StopButton>

            <EditButton isEditing={isEditing}
            onComponentClick={editButtonClick}>
            </EditButton>

            <AddLaneButton ref={addLaneButtonRef}></AddLaneButton>

            <button className={`loop_button ${looping ? 'selected' : ''} `} title='Loop session'
            ref={loopButtonRef}
            onClick={() => {setLooping(!looping); toggleLooping()}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-repeat2-icon lucide-repeat-2"><path d="m2 9 3-3 3 3"/><path d="M13 18H7a2 2 0 0 1-2-2V6"/><path d="m22 15-3 3-3-3"/><path d="M11 6h6a2 2 0 0 1 2 2v10"/></svg>
            </button>
            
            <div className="middle_buttons">
                <button id="save_workspace_button" title='save workspace'
                ref={saveButtonRef}
                onClick={() => { 
                    closeAllScreens();
                    setSessionSaveScreen(!showSessionSaveScreen); setSessionLoadScreen(false); 
                }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>
                </button>

                <button id="open_workspace_load_button" title='load session'
                ref={loadButtonRef}
                onClick={() => { 
                    closeAllScreens();
                    if(isEditingRef.current) {
                        editButtonClick(); 
                    }
                    setSessionLoadScreen(!showSessionLoadScreen); 
                    setShowToolTips(false); 
                }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scroll-text"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>


                { showToolTips && 
                <div className="tooltip">
                    Click here to load a preset session
                    <div className="tooltip-arrow" />
                </div> }

                </button>
            </div>


            <div className="bottom_buttons">
                <button id="user_button" 
                onClick={() => { 
                    closeAllScreens();
                    setShowProfileScreen(!showProfileScreen); 
                }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-user-round-icon lucide-circle-user-round"><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></svg>   
                
                {/* { showToolTips && 
                <div className="tooltip">
                    Create an account to save your sessions and patterns
                    <div className="tooltip-arrow" />
                </div> } */}
                </button>

                <NotificationsButton 
                notificationsNumber={notificationsNumber}
                onComponentClick={() => { 
                    closeAllScreens(); 
                    setShowNotificationsScreen(!showNotificationsScreen); 
                }} 
                />

                <button id="settings_button"
                onClick={() => {
                    closeAllScreens(); 
                    setShowSettingsScreen(!showSettingsScreen);
                }}>
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
