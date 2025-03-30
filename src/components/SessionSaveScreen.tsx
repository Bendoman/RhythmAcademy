import React, { HTMLInputTypeAttribute, useEffect, useRef, useState } from 'react'
import './styles/session_screen.css';
import { useSearchParams } from 'react-router-dom';
import { uploadToBucket } from '../scripts/main';
import { lanes } from '../scripts/main';
import { supabase } from '../scripts/supa-client.ts';
import Lane from '../scripts/Lane';

interface ISessionSaveScreenProps {
    setSessionSaveScreen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SessionSaveScreen: React.FC<ISessionSaveScreenProps> 
= ({ setSessionSaveScreen }) => {
    let sessionName = useRef<string>('');
    let save_bucket_ref = useRef<HTMLSelectElement>(null); 
    let friends_checkbox_ref = useRef<HTMLInputElement>(null); 

    const [savedStatus, setSavedStatus] = useState(''); 

    const handleKeyDown = (event: KeyboardEvent) => {
        if(event.key != 'Escape')
            return; 
        setSessionSaveScreen(false);
    }

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); }
    }, []);

    const onSaveSessionClick = async (sessionName: string) => {
        const { data, error } = await supabase.auth.getUser();

        if(!data || !data.user || !save_bucket_ref.current){
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

        await uploadToBucket(`${save_bucket_ref.current.value}_sessions`, `${data.user.id}/${sessionName}`, sessionName,content);

        if(friends_checkbox_ref.current?.checked) {
            await uploadToBucket(`friend_sessions`, `${data.user.id}/${sessionName}`, sessionName,content);
        }


        setSavedStatus(`session: ${sessionName} saved!`);
        console.log(friends_checkbox_ref.current?.value); 
    }

    return (<>
    <div className="session_save_screen">
        <div className="closeContainer"
            onClick={()=> { setSessionSaveScreen(false); }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </div>

        <div className="save_content">
            <label htmlFor="session_name_input">Session name: </label>
            <input type="text" id='session_name_input' 
            onChange={(event) => {sessionName.current = event.target.value}}/>
            <button id='save_session_button' onClick={() => {
                onSaveSessionClick(sessionName.current);
            }}>Save</button>

            <select ref={save_bucket_ref} name="bucket" id="save_bucket">
                <option value="public">public</option>
                <option value="private">private</option>
                {/* <option value="friend">friend</option> */}
            </select>

            
            <label htmlFor="visible_to_friends_check">Visible to friends:</label>
            <input ref={friends_checkbox_ref} id="visible_to_friends_check" type="checkbox" />

            { savedStatus && <p>{savedStatus}</p>}
        </div>
    </div>
    </>)
}

export default SessionSaveScreen