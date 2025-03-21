import React, { useRef, useState } from 'react'
import './styles/session_screen.css';
import { useSearchParams } from 'react-router-dom';
import { saveSession, uploadToBucket } from '../scripts/main';
import { lanes } from '../scripts/main';
import { supabase } from '../scripts/supa-client.ts';
import Lane from '../scripts/Lane';

interface ISessionSaveScreenProps {
    setSessionSaveScreen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SessionSaveScreen: React.FC<ISessionSaveScreenProps> 
= ({ setSessionSaveScreen }) => {
    let sessionName = useRef<string>('');
    const [savedStatus, setSavedStatus] = useState(''); 
    
    const onSaveSessionClick = async (sessionName: string) => {
        const { data, error } = await supabase.auth.getUser();

        if(!data || !data.user){
            setSavedStatus('Error getting user info');
            return;  
        }

        if(!sessionName) {
            setSavedStatus('enter session name');
            return; 
        }

        let sessionObject: { lanes: Lane[] } = { lanes: [] };

        lanes.forEach(lane => {
            sessionObject.lanes.push(lane); 
        });

        console.log(sessionObject.lanes);
        let content = JSON.stringify(sessionObject);
        await uploadToBucket('sessions', `${data.user.id}/${sessionName}`, sessionName,content);

        setSavedStatus(`session: ${sessionName} saved!`);
    }

    return (<>
    <div className="session_save_screen">
        <div className="closeContainer"
            onClick={()=> { setSessionSaveScreen(false); }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </div>

        <div className="save_content">
            <label htmlFor="session_name_input">Session name: </label>
            <input type="text" id='session_name_input' 
            onChange={(event) => {sessionName.current = event.target.value}}/>
            <button id='save_session_button' onClick={() => {
                onSaveSessionClick(sessionName.current);
            }}>Save</button>

            { savedStatus && <p>{savedStatus}</p>}
        </div>
    </div>
    </>)
}

export default SessionSaveScreen