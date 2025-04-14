import React, { useEffect, useRef, useState } from 'react'

import '../styles/menu_screens.css';``
import '../styles/session_screen.css';

import Lane from '../../scripts/classes/Lane';
import { createRoot } from 'react-dom/client';
import { supabase } from '../../scripts/helpers/supa-client';
import { useAppContext } from '../AppContextProvider';
import { LoadedLanePreview } from '../../scripts/types';
import { saveToLocalStorage } from '../../scripts/helpers/utils';
import ChangeLaneKey from '../run_controls/ChangeLaneKey';
import LaneEditingPanel from '../lane_editing/LaneEditingPanel';
import { deleteLane, lanes, onAddLaneButtonClick, remapLane, saveCurrentSessionLocally } from '../../scripts/main'; 
import { newnewRetrieveBucketList, retrieveBucketData, retrieveFriendBucketList, retrievePublicBucketList } from '../../scripts/helpers/supa-utils';
import { CloseButtonSVG, RightArrow } from '../../assets/svg/Icons';
import { checkDomainOfScale } from 'recharts/types/util/ChartUtils';

export const createNewLane = (inputKey: string, setShowLogo: React.Dispatch<React.SetStateAction<boolean>>) => {
    const canvasContainer = onAddLaneButtonClick(inputKey); 
    if(!canvasContainer)
        return; 

    const canvas = canvasContainer.querySelector('canvas') as HTMLCanvasElement
    
    const laneEditingSection = canvasContainer.querySelector(".lane_editing_section")
    if(!laneEditingSection)
        return;

    const root = createRoot(laneEditingSection);
    const laneContent = document.createElement('div');
    const contentRoot = createRoot(laneContent);
    
    root.render(<LaneEditingPanel canvas={canvas} setShowLogo={setShowLogo}/>);

    laneContent.classList.add('lane_content');
    contentRoot.render(<ChangeLaneKey canvas={canvas}/>)
    
    canvasContainer.appendChild(laneContent);
}

const SessionLoadScreen = () => {
    const { 
        setShowLogo, setSessionLoadScreen, 
        setCurrentSessionName, setCurrentSessionAltered,  
        setShowSessionToolTip } = useAppContext(); 

    const [popupStatus, setPopupStatus] = useState(''); 
    const [selectedTab, setSelectedTab] = useState('public');
    const [loadedFolders, setLoadedFolders] = useState<string[] | null>(null);
    const [loadedSessions, setLoadedSessions] = useState<[string,string][] | null>(null);

    const [expanded, setExpanded] = useState<{ [key: string ]: boolean }>({}); 
    const [hoveredSession, setHoveredSession] = useState<LoadedLanePreview | null>(null); 

    const handleKeyDown = (event: KeyboardEvent) => {
        if(event.key != 'Escape') { return } 
        setSessionLoadScreen(false);
    }
    
    const onLoadSessionClick = async (folderName: string, sessionName: string) => {
        const userId = (await supabase.auth.getUser()).data.user?.id as string;
        
        if(selectedTab != 'public' && !userId) {
            // The public bucket does not require authenticated access
            setPopupStatus(`${folderName}/${sessionName}_loading_session_error`); 
            setTimeout(() => setPopupStatus(''), 1500); 
            return; 
        }
        
        let sessionData = await retrieveBucketData(`${selectedTab}_sessions`, `${folderName}/${sessionName}`);

        if(!sessionData) {
            setPopupStatus(`${folderName}/${sessionName}
                `); 
            setTimeout(() => setPopupStatus(''), 1500); 
            return; 
        }

        let newLanes = sessionData.lanes as Lane[];
        for(let i = lanes.length - 1; i >= 0; i--) { 
            deleteLane(lanes[i], lanes[i].canvas) 
        }

        newLanes.forEach(newLane => {
            createNewLane(newLane.inputKey, setShowLogo);
            remapLane(lanes[lanes.length - 1], newLane, true);
        });

        saveCurrentSessionLocally(); 
        setCurrentSessionName(sessionName);

        setShowLogo(false); 
        setShowSessionToolTip(true); 
        setCurrentSessionAltered(false); 
        saveToLocalStorage('stats', '');

        setPopupStatus(`${folderName}/${sessionName}_loading_session_success`); 
        setTimeout(() => setPopupStatus(''), 1500); 
    }

    const changeHoveredSession = async(folderName?: string, sessionName?: string) => {        
        if(!sessionName) {
            setHoveredSession(null); 
            return; 
        }
        let totalNotes = 0; 
        let numberOfLanes = 0; 
        let subdivisions: number[] = [];
        
        let sessionData;
        if(folderName == 'public')
            sessionData = await retrieveBucketData(`${selectedTab}_sessions`, sessionName);
        else 
            sessionData = await retrieveBucketData(`${selectedTab}_sessions`, `${folderName}/${sessionName}`);

        let sessionLanes = sessionData.lanes as Lane[];
        sessionLanes.forEach(lane => {
            numberOfLanes++;
            totalNotes += lane.notes.length; 
            if (!subdivisions.some(sd => sd === lane.subdivision)) {
                subdivisions.push(lane.subdivision);
            }
        });

        let session:LoadedLanePreview = 
        {sessionName: sessionName, totalNotes: totalNotes, 
            numberOfLanes: numberOfLanes, subdivisions: subdivisions};
        
        setHoveredSession(session);
    }

    const getSavedSessions = async() => {
        let data;
        if(selectedTab == 'friend')
            data = await retrieveFriendBucketList(`${selectedTab}_sessions`);
        else if(selectedTab == 'public') 
            data = await retrievePublicBucketList('public_sessions');
        else
            data = await newnewRetrieveBucketList(`${selectedTab}_sessions`);

        let folders: string[] = [];
        let sessions: [string,string][] = []; 
        if(data) {
            for(const folder of data) {
                if(folder.data) {
                    for(const session of folder.data) {
                        sessions.push([folder.ownerid, session.name]);
                    }
                } else {
                    let f = folder.split('/')[0];
                    if(!folders.includes(f)){ folders.push(f) }; 
                    sessions.push([`${f}`, folder.split('/').slice(1).join('/')]);
                }
            }
        }

        if(folders.length > 0) 
            setLoadedFolders(folders); 
        else 
            setLoadedFolders(null); 

        if(sessions)
            setLoadedSessions(sessions);
    }

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); }
    }, []);

    useEffect(() => {
        getSavedSessions();
    }, [selectedTab]);

    return (<>
    <div className="session_load_screen screen">
        <div className="closeContainer"
            onClick={()=> { setSessionLoadScreen(false) }}>
            <CloseButtonSVG/>
        </div>

        <div className="tabs">
            <div className={`tab ${selectedTab == 'public' ? 'selected' : ''}`} 
            onClick={()=>{setSelectedTab('public'); setHoveredSession(null)}}><p>Public</p></div>
            <div className={`tab ${selectedTab == 'private' ? 'selected' : ''}`} 
            onClick={()=>{setSelectedTab('private'); setHoveredSession(null)}}>Private</div>
            <div className={`tab ${selectedTab == 'friend' ? 'selected' : ''}`} 
            onClick={()=>{setSelectedTab('friend'); setHoveredSession(null)}}>Friend's</div>
        </div>

        <div className="load_content">
            { loadedSessions && loadedSessions.length == 0 && <p>Nothing here</p>}

            { loadedFolders && loadedFolders.map((folder, index) => {
                return (
                <div key={index} className='drop_down_container'> 
                    <div className="drop_down" onClick={() => {
                        setExpanded(prev => ({ ...prev, [folder]: !prev[folder] }));
                    }}>
                    <p>{folder}</p>
                    </div>
                
                    { expanded[folder] && loadedSessions && loadedSessions.map((session, index) => {
                        if(session[0] == folder) return (
                        <div key={index} className="loaded_session_info"
                            onClick={() => {onLoadSessionClick(session[0], session[1])}}>
                            <p>{session[1]}</p>
                            { hoveredSession && hoveredSession.sessionName === `${session[1]}` && 
                            <div className='hoveredInfo'>
                                <p>Total notes: { hoveredSession.totalNotes }</p>
                                <p>Number of lanes: { hoveredSession.numberOfLanes }</p>
                                <p>Subdivisions { hoveredSession.subdivisions.map((sd) => {return ` : ${sd}`}) }</p>
                            </div>}

                            { !hoveredSession && <button 
                            onMouseOver={(e) => {e.stopPropagation();}}
                            onClick={(e) => {e.stopPropagation(); changeHoveredSession(session[0], session[1]);}}>Info</button> }

                            { hoveredSession && hoveredSession.sessionName === `${session[1]}` && <button onMouseOver={(e) => {e.stopPropagation();}} onClick={(e) => {e.stopPropagation(); changeHoveredSession();}}>Hide info</button>}

                            { popupStatus == `${folder}/${session[1]}_loading_session_error` 
                            && ( <div className="error_popup">Error loading</div>)}
                            { popupStatus == `${folder}/${session[1]}_loading_session_success` 
                            && ( <div className="confirmation_popup">Session loaded</div>)}
                        </div>)
                    })}
                </div>)
            })}

            { !loadedFolders && loadedSessions && loadedSessions.map((session, index) => {
                return (
                <div key={index} className="loaded_session_info nofolders"
                    onClick={() => {onLoadSessionClick(session[0], session[1])}}>
                    <p>{session[1]}</p>
                    { hoveredSession && hoveredSession.sessionName === `${session[1]}` && 
                    <div className='hoveredInfo'>
                        <p>Total notes: { hoveredSession.totalNotes } </p>
                        <p>Number of lanes: { hoveredSession.numberOfLanes } </p>
                        <p>Subdivisions: { hoveredSession.subdivisions.map((sd) => {return <>{`${sd} `}</>}) }</p>
                    </div>}

                    { !hoveredSession && <button 
                    onMouseOver={(e) => {e.stopPropagation();}}
                    onClick={(e) => {e.stopPropagation(); changeHoveredSession(session[0], session[1]);}}>Info</button> }

                    { hoveredSession && hoveredSession.sessionName === `${session[1]}` && <button onMouseOver={(e) => {e.stopPropagation();}} onClick={(e) => {e.stopPropagation(); changeHoveredSession();}}>Hide info</button>}

                    { popupStatus == `${session[0]}/${session[1]}_loading_session_error` 
                    && ( <div className="error_popup">Error loading</div>)}
                    { popupStatus == `${session[0]}/${session[1]}_loading_session_success` 
                    && ( <div className="confirmation_popup">Lane loaded</div>)}
                </div>)
            })} 
        </div>
    </div>
    </>)
}

export default SessionLoadScreen