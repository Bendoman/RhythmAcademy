import React, { useEffect, useRef, useState } from 'react'

import Lane from '../scripts/Lane';
import Note from '../scripts/Note';
import './styles/session_screen.css';// TODO: Refactor this name
import LaneEditingPanel from './LaneEditingPanel';
import ChangeLaneKey from './run_controls/ChangeLaneKey';

import { supabase } from '../scripts/supa-client';
import { createRoot } from 'react-dom/client';
import { newnewRetrieveBucketList, newRetrieveBucketList, retrieveFriendBucketList, retrievePublicBucketList } from '../scripts/SupaUtils';
import { deleteLane, drawSingleLane, lanes, onAddLaneButtonClick, remapLane, retrieveBucketData, retrieveBucketList, saveCurrentSessionLocally, setLongestLane, updateAllLaneSizes } from '../scripts/main'; // TODO: Refactor this name
import { FileObject } from '@supabase/storage-js';
import { LoadedLanePreview } from '../scripts/types';
import { useAppContext } from './AppContextProvider';
import { saveToLocalStorage } from '../scripts/Utils';

export const createNewLane = (inputKey: string) => {
    const canvasContainer = onAddLaneButtonClick(inputKey); 

    if(!canvasContainer)
        return; 
    
    const laneEditingSection = canvasContainer.querySelector(".lane_editing_section")

    if(!laneEditingSection)
        return;

    // TODO: Rename these
    const root = createRoot(laneEditingSection);
    const laneContent = document.createElement('div');
    const contentRoot = createRoot(laneContent);
    
    const canvas = canvasContainer.querySelector('canvas') as HTMLCanvasElement

    root.render(<LaneEditingPanel canvas={canvas}/>);

    // TODO: Refactor name
    laneContent.classList.add('lane_content');
    laneContent.innerText = "testing";
    contentRoot.render(<ChangeLaneKey canvas={canvas}/>)
    
    canvasContainer.appendChild(laneContent);
}

const SessionLoadScreen = () => {
    const { setSessionLoadScreen, currentSessionName, setCurrentSessionName, setShowSessionToolTip } = useAppContext(); 
    
    let sessionName = useRef<string>('');
    const [loadStatus, setLoadStatus] = useState(''); 
    const loadSessionSelectRef = useRef<HTMLSelectElement | null>(null);

    const [loadedSessions, setLoadedSessions] = useState<[string,string][] | null>(null);

    const [selectedTab, setSelectedTab] = useState('public');

    const handleKeyDown = (event: KeyboardEvent) => {
        if(event.key != 'Escape')
            return; 
        setSessionLoadScreen(false);
    }

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); }
    }, []);
    
    const onLoadSessionClick = async (folderName: string, sessionName: string) => {
        const { data, error } = await supabase.auth.getUser();

        if(folderName != 'public' && !data.user) {
            setLoadStatus('Error retrieving user');
            return; 
        }

        // if(!loadSessionSelectRef || !loadSessionSelectRef.current) {
        //     setLoadStatus('No session selected');
        //     return; 
        // }
        
        for(let i = lanes.length - 1; i >= 0; i--) {
            deleteLane(lanes[i], lanes[i].canvas);
        }
        console.log(sessionName);

        let sessionData = await retrieveBucketData(`${selectedTab}_sessions`, 
            selectedTab == 'public' ? sessionName : `${folderName}/${sessionName}`);


        let newLanes = sessionData.lanes as Lane[];
        
        newLanes.forEach(newLane => {
            createNewLane(newLane.inputKey);
            remapLane(lanes[lanes.length - 1], newLane);
        });

        // setLongestLane();
        saveCurrentSessionLocally(); 
        setLoadStatus(`Session: ${sessionName} loaded!`);

        //TODO:  Combine id with name in here instead of splitting after
        setCurrentSessionName(sessionName);
        saveToLocalStorage('stats', '');
        

        setShowSessionToolTip(true); 
    }

    const [expanded, setExpanded] = useState<{ [key: string ]: boolean }>({}); 
    const [hoveredSession, setHoveredSession] = useState<LoadedLanePreview | null>(null); 
    
    const changeHoveredSession = async(folderName?: string, sessionName?: string) => {
        if(!sessionName) {
            console.log('here')
            setHoveredSession(null); 
            return; 
        }


        let totalNotes = 0; 
        let numberOfLanes = 0; 
        let timeSignatures: number[][] = [];
        
        let sessionData;
        if(folderName == 'public')
            sessionData = await retrieveBucketData(`${selectedTab}_sessions`, sessionName);
        else 
            sessionData = await retrieveBucketData(`${selectedTab}_sessions`, `${folderName}/${sessionName}`);

        let sessionLanes = sessionData.lanes as Lane[];
        sessionLanes.forEach(lane => {
            numberOfLanes++;
            totalNotes += lane.notes.length; 
            if (!timeSignatures.some(ts => ts[0] === lane.timeSignature[0] && ts[1] === lane.timeSignature[1])) {
                timeSignatures.push([...lane.timeSignature]);
            }
        });

        let session:LoadedLanePreview = 
        {sessionName: sessionName, totalNotes: totalNotes, 
            numberOfLanes: numberOfLanes, timeSignatures: timeSignatures};
        
        setHoveredSession(session);
    }

    const getSavedSessions = async() => {
        // if(!loadSessionSelectRef || !loadSessionSelectRef.current)
        //     return; 

        let data;
        let sessionSelectInnerHTML = ''; 

        if(selectedTab == 'friend')
            data = await retrieveFriendBucketList(`${selectedTab}_sessions`);
        else if(selectedTab == 'public')
            data = await retrievePublicBucketList();
        else
            data = await newnewRetrieveBucketList(`${selectedTab}_sessions`);

        let loadedSessions: [string,string][] = []; 


        
        if(data) {
            console.log(selectedTab, data);
            for(const folder of data) {
                console.log(folder);
                if(folder.data) {
                    for(const session of folder.data) {
                        // console.log(session, folder);             
                        loadedSessions.push([folder.ownerid, session.name]);
                    }
                } else {
                    loadedSessions.push(['public', folder]);
                }
            }
        }


        if(loadedSessions)
            setLoadedSessions(loadedSessions);
    }

    useEffect(() => {
        getSavedSessions();
    }, [selectedTab]);

    return (<>
    <div className="session_load_screen screen">
        <div className="closeContainer"
            onClick={()=> { setSessionLoadScreen(false); }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </div>

        <div className="tabs">
            <div className={`tab ${selectedTab == 'public' ? 'selected' : ''}`} 
            onClick={()=>{setSelectedTab('public')}}><p>Public</p></div>
            <div className={`tab ${selectedTab == 'private' ? 'selected' : ''}`} 
            onClick={()=>{setSelectedTab('private')}}>Private</div>
            <div className={`tab ${selectedTab == 'friend' ? 'selected' : ''}`} 
            onClick={()=>{setSelectedTab('friend')}}>Friend's</div>
        </div>

        <div className="load_content" 
                        // onMouseLeave={() => {
                        //     changeHoveredSession();
                        // }}
                        >
            {/* <label htmlFor="session_name_select">Session name: </label> */}

            {/* <select ref={loadSessionSelectRef} id="session_name_select"></select> */}
            
            {/* <button id='save_session_button' onClick={() => {
                if(loadSessionSelectRef.current){ onLoadSessionClick(loadSessionSelectRef.current.value); }
            }}>load</button> */}


            <div className="drop_down" onClick={() => {
                setExpanded(prev => ({
                    ...prev, 
                    ['all']: !prev['all']
                }));
            }}>
                dropper
            </div>
            {/* expanded['all'] && */}
            
            {/* TOOD: Star sessions, add to saved bucket */}
           {  expanded['all'] && loadedSessions && loadedSessions.map((session, index) => {
               return <div key={index} className="loaded_session_info"
                // onMouseEnter={() => {
                //     changeHoveredSession(`${session[0]}/${session[1]}`);
                // }}
                // onMouseLeave={() => {
                //     changeHoveredSession();
                // }}
                onClick={() => {onLoadSessionClick(session[0], session[1])}}>
                <p>{session[1]}</p>
                { hoveredSession && hoveredSession.sessionName === `${session[0]}/${session[1]}` && 
                <>
                    <p>Total notes: { hoveredSession.totalNotes } </p>
                    <p>Number of lanes: { hoveredSession.numberOfLanes } </p>
                    <p>Time signatures: { hoveredSession.timeSignatures.map((ts) => {return <>{`[${ts[0]}:${ts[1]}] `}</>}) }</p>
                    <button onClick={(e) => {e.stopPropagation(); changeHoveredSession();}}>Hide info</button>
                </>}

                { <button onClick={(e) => {e.stopPropagation(); changeHoveredSession(session[0], session[1]);}}>Info</button>}
                </div>
           })}
           
           { loadStatus && <p>{loadStatus}</p>}
        </div>
    </div>
    </>)
}

export default SessionLoadScreen