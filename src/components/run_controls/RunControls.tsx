import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import PlayButton from './PlayButton';
import PauseButton from './PauseButton';
import StopButton from './StopButton';
import EditButton from './EditButton';

import '../styles/run_controls.css';
import AddLaneButton from './AddLaneButton.tsx';
import { deleteLane, enableAudio, lanes, onEditButtonClick, onPauseButtonClick, onPlayButtonClick, onStopButtonClick, saveCurrentSessionLocally, toggleLooping } from '../../scripts/main.ts';
import NotificationsButton from './NotificationsButton.tsx';
import { saveToLocalStorage } from '../../scripts/helpers/utils.ts';
import { useAppContext } from '../AppContextProvider.tsx';
import { Eraser, ExpanderIcon, LoadIcon, LoopIcon, QuestionMarkIcon, SaveIcon, SettingsIcon, UserIcon } from '../../assets/svg/Icons.tsx';

const RunControls = () => {
    const {
        setShowStats, setStats, setShowLogo,
        showSessionLoadScreen, setSessionLoadScreen,
        showSessionSaveScreen, setSessionSaveScreen,
        showProfileScreen, setShowProfileScreen,
        showNotificationsScreen, setShowNotificationsScreen,
        notificationsNumber, showSettingsScreen, 
        setShowSettingsScreen, showToolTips, 
        setShowToolTips, setCurrentSessionName,
        setCurrentSessionAltered,setShowSessionToolTip, 
        isEditingRef
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
        enableAudio(); 
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
        if(isPlayingRef.current || isPausedRef.current) {
            isStoppedRef.current = !isStoppedRef.current; 
            setIsStopped(isStoppedRef.current);

            setIsPlaying(false);
            isPlayingRef.current = false; 

            setIsPaused(false);
            isPausedRef.current = false; 
            
            // TODO: Change when this shows up or have seperate button for resetting run
            setShowStats(true);

            let {stats, statsDisqualified} = onStopButtonClick(); 
            if(statsDisqualified)
                setCurrentSessionAltered(true); 
            setStats(stats);
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
        enableAudio(); 
        if(lanes.length > 0 && !isPlayingRef.current) { 
            if(isEditingRef.current) {
                editButtonClick(); 
            }
            
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

            <button className={`loop_button ${looping ? 'selected' : ''} `} title='Loop session' ref={loopButtonRef}
            onClick={() => {setLooping(!looping); toggleLooping()}}>
                <LoopIcon/>
            </button>
            
            <div className="middle_buttons">
                <button id="save_workspace_button" title='save workspace'
                ref={saveButtonRef}
                onClick={() => { 
                    closeAllScreens();
                    setSessionSaveScreen(!showSessionSaveScreen); setSessionLoadScreen(false); 
                }}>
                    <SaveIcon/>
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
                <LoadIcon/>

                { showToolTips && 
                <div className="tooltip">
                    Click here to load a preset session
                    <div className="tooltip-arrow" />
                </div> }

                </button>

                <button title="clear session" id="clear_session_button" onClick={() => {
                    setCurrentSessionAltered(true);
                    for(let i = lanes.length - 1; i >= 0; i--) {
                        deleteLane(lanes[i], lanes[i].canvas);
                    }
                    setShowLogo(true);
                }}> <Eraser/> </button>
            </div>


            <div className="bottom_buttons">
                <button id="user_button" 
                onClick={() => { 
                    closeAllScreens();
                    setShowProfileScreen(!showProfileScreen); 
                }}>
                    <UserIcon/>
                </button>

                <NotificationsButton 
                notificationsNumber={notificationsNumber}
                onComponentClick={() => { 
                    closeAllScreens(); 
                    setShowNotificationsScreen(!showNotificationsScreen); 
                }}/>

                <button id="settings_button"
                onClick={() => {
                    closeAllScreens(); 
                    setShowSettingsScreen(!showSettingsScreen);
                }}>
                    <SettingsIcon/>
                </button>
                
                <a href="https://github.com/Bendoman/RhythmAcademy/blob/main/README.md" target='blank'>
                <button id="help_button">
                    <QuestionMarkIcon/>
                </button>
                </a>

                {/* TODO: Refactor this name and change how the toggle works*/}
                <button id="expand_button"
                className={menuHover ? 'selected' : ''}
                onClick={() => {setMenuHover(!menuHover); setShowToolTips(false)}}>
                    <ExpanderIcon/>
                </button>
            </div>
        </div>
    </div>
    </>)
}

export default RunControls
