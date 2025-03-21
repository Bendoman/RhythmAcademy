import React, { useEffect, useRef, useState } from 'react'
import './styles/session_screen.css';
import { deleteLane, drawSingleLane, lanes, onAddLaneButtonClick, retrieveBucketData, retrieveBucketList, setLanes, updateAllLaneSizes } from '../scripts/main';
import { supabase } from '../scripts/supa-client';
import Lane from '../scripts/Lane';
import LaneEditingPanel from './LaneEditingPanel';
import { createRoot } from 'react-dom/client';
import ChangeLaneKey from './run_controls/ChangeLaneKey';
import Note from '../scripts/Note';

interface ISessionLoadScreenProps {
    setSessionLoadScreen: React.Dispatch<React.SetStateAction<boolean>>;
}

const createNewLane = (inputKey: string) => {
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

    const unmount=()=>{console.log("unmounting"); 
        root.unmount(); contentRoot.unmount()
    };
    
    root.render(<LaneEditingPanel unmount={unmount} canvas={canvasContainer.querySelector('canvas') as HTMLCanvasElement}/>);

    // TODO: Refactor name
    laneContent.classList.add('lane_content');
    laneContent.innerText = "testing";
    contentRoot.render(<ChangeLaneKey/>)
    
    canvasContainer.appendChild(laneContent);
}

const SessionLoadScreen: React.FC<ISessionLoadScreenProps> 
= ({ setSessionLoadScreen }) => {
    let sessionName = useRef<string>('');
    const [loadStatus, setLoadStatus] = useState(''); 
    const loadSessionSelectRef = useRef<HTMLSelectElement | null>(null);

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

        let sessionData = await retrieveBucketData('sessions', `${data.user.id}/${sessionName}`);
        let newLanes = sessionData.lanes as Lane[];
        
        newLanes.forEach(newLane => {
            createNewLane(newLane.inputKey);
            let laneObject = lanes[lanes.length - 1];
            laneObject.bpm =  newLane.bpm; 
            laneObject.measureCount = newLane.measureCount; 
            laneObject.noteGap = newLane.noteGap; 
            laneObject.maxWrongNotes = newLane.maxWrongNotes; 
            laneObject.hitsound = newLane.hitsound; 
            laneObject.timeSignature = newLane.timeSignature; 
            laneObject.hitPrecision = newLane.hitPrecision; 
            laneObject.notes = []; 
            // TODO: Optimize this for lower load times
            newLane.notes.forEach((note) => {
                console.log(note);
                // TODO Change to new note with index constructor
                laneObject.notes.push(new Note(note.index));   
            })
            laneObject.hitzone = laneObject.calculateHitzone(); 
            laneObject.recalculateHeight(); 
            
            updateAllLaneSizes();
            laneObject.handleResize();
            drawSingleLane(laneObject); 
            
            console.log(laneObject);
        });

        setLoadStatus(`Session: ${sessionName} loaded!`);
    }

    const getSavedSessions = async() => {
        if(!loadSessionSelectRef || !loadSessionSelectRef.current)
            return; 

        let data = await retrieveBucketList('sessions');
        let sessionSelectInnerHTML = ''; 
        data?.forEach(session => {
            sessionSelectInnerHTML += `<option value="${session.name}">${session.name}</option>`;
        });

        loadSessionSelectRef.current.innerHTML = sessionSelectInnerHTML; 
    }

    useEffect(() => {
        getSavedSessions();
    }, []);

    return (<>
    <div className="session_load_screen">
        <div className="closeContainer"
            onClick={()=> { setSessionLoadScreen(false); }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </div>

        <div className="load_content">
            <label htmlFor="session_name_select">Session name: </label>

            <select ref={loadSessionSelectRef} id="session_name_select"></select>
            
            <button id='save_session_button' onClick={() => {
                if(loadSessionSelectRef.current){ onLoadSessionClick(loadSessionSelectRef.current.value); }
            }}>load</button>

            { loadStatus && <p>{loadStatus}</p>}
        </div>
    </div>
    </>)
}

export default SessionLoadScreen