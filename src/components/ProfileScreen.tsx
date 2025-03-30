import React from 'react'
// TODO: Refactor this name
import './styles/session_screen.css';

interface IProfileScreenProps {
    setShowProfileScreen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ProfileScreen: React.FC<IProfileScreenProps> = ({ setShowProfileScreen }) => {
    return (<>
    <div className="profile_screen">
        Profile
    </div>
    </>)
}

export default ProfileScreen