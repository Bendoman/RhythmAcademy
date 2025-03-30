import React, { useEffect } from 'react'
// TODO: Refactor this name
import './styles/session_screen.css';
import { acceptPendingFriendRequest } from '../scripts/SupaUtils';

interface INotificationsScreenProps {
    setShowNotificationsScreen: React.Dispatch<React.SetStateAction<boolean>>;
    setNotificationsNumber: React.Dispatch<React.SetStateAction<number>>;
    pendingFriendRequests: string[][];
}

const NotificationsScreen: React.FC<INotificationsScreenProps> = ({ setShowNotificationsScreen, setNotificationsNumber, pendingFriendRequests}) => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if(event.key != 'Escape')
            return; 
        setShowNotificationsScreen(false);
    }
    
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); }
    }, []);

    return (<>
    <div className="notifications_screen">
        <div className="closeContainer"
        onClick={()=> { setShowNotificationsScreen(false); }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </div>

        <div className="tabs">
            <div className="tab selected">Notifications</div>
        </div>

        <div className="notifications_content">
            {pendingFriendRequests && pendingFriendRequests.map((requestArray, index) => (
                <div key={index}>
                    <p>{`${requestArray[1]}`}</p>
                    <button onClick={() => {acceptPendingFriendRequest(requestArray[0])}}>Accept</button>
                </div>
            ))}
        </div>
    </div>
    </>)
}

export default NotificationsScreen