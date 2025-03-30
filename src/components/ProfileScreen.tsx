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
        Profile
    </div>
    </>)
}

export default ProfileScreen