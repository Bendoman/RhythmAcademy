import React, { useEffect } from 'react'
// TODO: Refactor this name
import './styles/session_screen.css';

interface IProfileScreenProps {
    setShowProfileScreen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ProfileScreen: React.FC<IProfileScreenProps> = ({ setShowProfileScreen }) => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if(event.key != 'Escape')
            return; 
        setShowProfileScreen(false);
    }

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); }
    }, []);
    
    return (<>
    <div className="profile_screen">
        <div className="closeContainer"
        onClick={()=> { setShowProfileScreen(false); }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </div>

        <div className="tabs">
            <div className="tab selected">Profile</div>
        </div>

        <div className="profile_content">
            content
        </div>
    </div>
    </>)
}

export default ProfileScreen