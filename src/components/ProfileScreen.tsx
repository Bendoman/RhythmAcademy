import React, { useEffect, useState } from 'react'
// TODO: Refactor this name
import './styles/session_screen.css';
import { modifyFriend } from '../scripts/SupaUtils';

interface IProfileScreenProps {
    setShowProfileScreen: React.Dispatch<React.SetStateAction<boolean>>;
    acceptedFriends: string[][];
}

const ProfileScreen: React.FC<IProfileScreenProps> = ({ setShowProfileScreen, acceptedFriends }) => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if(event.key != 'Escape')
            return; 
        setShowProfileScreen(false);
    }

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); }
    }, []);
    
    const [selectedTab, setSelectedTab] = useState('profile');
    
    return (<>
    <div className="profile_screen">
        <div className="closeContainer"
        onClick={()=> { setShowProfileScreen(false); }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </div>

        <div className="tabs">
            <div className={`tab ${selectedTab == 'profile' ? 'selected' : ''}`} 
            onClick={()=>{setSelectedTab('profile')}}><p>Profile</p></div>
            <div className={`tab ${selectedTab == 'friends' ? 'selected' : ''}`} 
            onClick={()=>{setSelectedTab('friends')}}>Friends</div>
        </div>

        <div className="profile_content">
            { selectedTab == 'profile' && 
                <p>Profile</p>
            }
            
            {selectedTab == 'friends' && acceptedFriends && acceptedFriends.map((requestArray, index) => (
                <div key={index}>
                    <div className="friend_request">
                        <p>{`${requestArray[1]}`}</p>
                        <button className='decline' onClick={() => {modifyFriend('accepted', 'declined', requestArray[0])}}>Remove</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
    </>)
}

export default ProfileScreen