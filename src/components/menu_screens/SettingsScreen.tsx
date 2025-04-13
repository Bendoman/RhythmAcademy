import React, { useEffect, useState } from 'react'
import '../styles/session_screen.css';// TODO: Refactor this name
import '../styles/menu_screens.css';

import { useAppContext } from '../AppContextProvider';
import { CloseButtonSVG } from '../../assets/svg/Icons';
import { global_volume, setGlobalVolume } from '../../scripts/main';


const SettingsScreen = () => {
    const { setShowSettingsScreen } = useAppContext(); 
    const [selectedTab, setSelectedTab] = useState('public');
    const [volume, setVolume] = useState(global_volume); 

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
                <CloseButtonSVG/>
            </div>

            <div className="tabs">
                <div className={`tab ${selectedTab == 'public' ? 'selected' : ''}`} 
                onClick={()=>{setSelectedTab('public')}}><p>Settings</p></div>
            </div>

            <div className="settings_content">
                <div className="volume_container">
                    <label>Master volume:</label>
                    <input type="range" min="0" max="1" step="0.01" value={volume} className="slider" id="myRange" onInput={(e) => {
                        let target = e.target as HTMLInputElement;
                        let newVolume = parseFloat(target.value);
                        setVolume(newVolume);
                        setGlobalVolume(newVolume);
                    }}/>
                </div>
            </div>
        </div>
    </>)
}

export default SettingsScreen