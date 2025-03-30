import React, { useEffect, useRef, useState } from 'react'

import Lane from '../scripts/Lane';
import Note from '../scripts/Note';
import './styles/session_screen.css';// TODO: Refactor this name
import LaneEditingPanel from './LaneEditingPanel';
import ChangeLaneKey from './run_controls/ChangeLaneKey';

import { supabase } from '../scripts/supa-client';
import { createRoot } from 'react-dom/client';
import { newRetrieveBucketList, retrieveFriendBucketList } from '../scripts/SupaUtils';
import { deleteLane, drawSingleLane, lanes, onAddLaneButtonClick, remapLane, retrieveBucketData, retrieveBucketList, saveCurrentSessionLocally, setLongestLane, updateAllLaneSizes } from '../scripts/main'; // TODO: Refactor this name

interface ISessionLoadScreenProps {
    setSessionLoadScreen: React.Dispatch<React.SetStateAction<boolean>>;
}

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

const SessionLoadScreen: React.FC<ISessionLoadScreenProps> 
= ({ setSessionLoadScreen }) => {
    let sessionName = useRef<string>('');
    const [loadStatus, setLoadStatus] = useState(''); 
    const loadSessionSelectRef = useRef<HTMLSelectElement | null>(null);

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
    
    const onLoadSessionClick = async (sessionName: string) => {
        const { data, error } = await supabase.auth.getUser();

        if(!data.user) {
            setLoadStatus('Error retrieving user');
            return; 
        }

        if(!loadSessionSelectRef || !loadSessionSelectRef.current) {
            setLoadStatus('No session selected');
            return; 
        }
        
        for(let i = lanes.length - 1; i >= 0; i--) {
            deleteLane(lanes[i], lanes[i].canvas);
        }
        console.log(sessionName);

        let sessionData = await retrieveBucketData(`${selectedTab}_sessions`, `${sessionName}`);
        let newLanes = sessionData.lanes as Lane[];
        
        newLanes.forEach(newLane => {
            createNewLane(newLane.inputKey);
            remapLane(lanes[lanes.length - 1], newLane);
        });

        setLongestLane();
        saveCurrentSessionLocally(); 
        setLoadStatus(`Session: ${sessionName} loaded!`);
    }

    const getSavedSessions = async() => {
        if(!loadSessionSelectRef || !loadSessionSelectRef.current)
            return; 

        let data;
        let sessionSelectInnerHTML = ''; 

        if(selectedTab == 'friend')
            data = await retrieveFriendBucketList(`${selectedTab}_sessions`);
        else
            data = await newRetrieveBucketList(`${selectedTab}_sessions`);

        data?.forEach(folder => {
            folder?.data.forEach(session => {
                sessionSelectInnerHTML += `<option value="${folder.ownerid}/${session.name}">${session.name}</option>`;
            });
        });

        loadSessionSelectRef.current.innerHTML = sessionSelectInnerHTML; 
    }

    useEffect(() => {
        getSavedSessions();
    }, [selectedTab]);

    return (<>
    <div className="session_load_screen">
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

        <div className="load_content">
            <label htmlFor="session_name_select">Session name: </label>

            <select ref={loadSessionSelectRef} id="session_name_select"></select>
            
            <button id='save_session_button' onClick={() => {
                if(loadSessionSelectRef.current){ onLoadSessionClick(loadSessionSelectRef.current.value); }
            }}>load</button>

            { loadStatus && <p>{loadStatus}</p>}

            {/* <button onClick={newRetrieveBucketList}>test</button> */}

        </div>
    </div>
    </>)
}

export default SessionLoadScreen