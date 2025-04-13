import '../styles/menu_screens.css';
import '../styles/session_screen.css';

import Lane from '../../scripts/Lane.ts';
import { lanes } from '../../scripts/main.ts';
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../scripts/supa-client.ts';
import { useAppContext } from '../AppContextProvider.tsx';
import { uploadToBucket } from '../../scripts/SupaUtils.ts';
import { CloseButtonSVG } from '../../assets/svg/Icons.tsx';

const SessionSaveScreen = () => {
    let sessionName = useRef<string>('');
    const { setSessionSaveScreen } = useAppContext();
    let friends_checkbox_ref = useRef<HTMLInputElement>(null); 

    const [savedStatus, setSavedStatus] = useState(''); 
    const { currentSessionName, currentSessionAltered } = useAppContext(); 

    let saveContentRef = useRef<HTMLInputElement | null>(null); 
    
    const handleKeyDown = (event: KeyboardEvent) => {
        if(event.key != 'Escape')
            return; 
        setSessionSaveScreen(false);
    }

    const onSaveSessionClick = async () => {
        const userId = (await supabase.auth.getUser()).data.user?.id as string;
        if(!userId){
            setSavedStatus('Error getting user info');
            return;  
        }

        let name = ''; 
        if(sessionName.current ) { 
            name = sessionName.current 
        } else if(saveContentRef.current 
            && saveContentRef.current.defaultValue) {
            name = saveContentRef.current.defaultValue;
        }

        if(name == '' ) {
            setSavedStatus('enter session name');
            return; 
        }

        let sessionObject: { lanes: Lane[] } = { lanes: [] };
        lanes.forEach(lane => {
            sessionObject.lanes.push(lane); 
        });

        let content = JSON.stringify(sessionObject);
        await uploadToBucket('private_sessions', `${userId}/${name}`, name, content);
        if(friends_checkbox_ref.current?.checked) {
            await uploadToBucket(`friend_sessions`, `${userId}/${name}`, name, content);
        }

        setSavedStatus(`session: ${name} saved!`);
    }

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); }
    }, []);

    return (<>
    <div className="session_save_screen screen">
        <div className="closeContainer"
            onClick={()=> { setSessionSaveScreen(false); }}>
            <CloseButtonSVG/>
        </div>

        <div className="tabs">
            <div className={'tab selected'}>
                <p>Save session</p>
            </div>
        </div>

        <div className="save_content">
            <label htmlFor="session_name_input">Session name: </label>
            <input defaultValue={!currentSessionAltered && currentSessionName ? currentSessionName : ''}
            type="text" id='session_name_input' ref={saveContentRef}
            onChange={(event) => {sessionName.current = event.target.value}}/>
            
            <button id='save_session_button' onClick={() => {
                onSaveSessionClick();
            }}>Save</button>

            <label htmlFor="visible_to_friends_check">Visible to friends:</label>
            <input ref={friends_checkbox_ref} id="visible_to_friends_check" type="checkbox" />

            { savedStatus && <p>{savedStatus}</p>}
        </div>
    </div>
    </>)
}

export default SessionSaveScreen