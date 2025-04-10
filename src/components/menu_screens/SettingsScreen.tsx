import React, { useEffect, useState } from 'react'
import '../styles/session_screen.css';// TODO: Refactor this name
import '../styles/menu_screens.css';

import { useAppContext } from '../AppContextProvider';


const SettingsScreen = () => {
    const { setShowSettingsScreen } = useAppContext(); 
    const [selectedTab, setSelectedTab] = useState('public');
    
    const handleKeyDown = (event: KeyboardEvent) => {
        if(event.key != 'Escape'){ return; } 
        setShowSettingsScreen(false);
    }

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); }
    }, []);
    
    return (<>
        <div className="settings_screen screen">
            <div className="closeContainer"
                onClick={()=> { setShowSettingsScreen(false); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
            </div>

            <div className="tabs">
                <div className={`tab ${selectedTab == 'public' ? 'selected' : ''}`} 
                onClick={()=>{setSelectedTab('public')}}><p>Coming soon</p></div>
                {/* <div className={`tab ${selectedTab == 'private' ? 'selected' : ''}`} 
                onClick={()=>{setSelectedTab('private')}}>Private</div>
                <div className={`tab ${selectedTab == 'friend' ? 'selected' : ''}`} 
                onClick={()=>{setSelectedTab('friend')}}>Friend's</div> */}
            </div>
        </div>
    </>)
}

export default SettingsScreen