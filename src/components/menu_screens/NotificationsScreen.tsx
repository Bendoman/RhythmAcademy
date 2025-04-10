import React, { useEffect } from 'react'
// TODO: Refactor this name
import '../styles/session_screen.css';
import '../styles/menu_screens.css';
import { modifyFriend } from '../../scripts/SupaUtils';
import { useAppContext } from '../AppContextProvider';

const NotificationsScreen = () => {
    const { setShowNotificationsScreen, setNotificationsNumber, pendingFriendRequests} = useAppContext(); 
    
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
    <div className="notifications_screen screen">
        <div className="closeContainer"
        onClick={()=> { setShowNotificationsScreen(false); }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </div>

        <div className="tabs">
            <div className="tab selected">Friend Requests</div>
        </div>

        <div className="notifications_content">
            {pendingFriendRequests && pendingFriendRequests.map((requestArray, index) => (
                <div key={index}>
                    <p>{`Date sent: ${new Date(requestArray[2]).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})}`}</p>
                    <div className="friend_request">
                        <p>{`${requestArray[1]}`}</p>
                        <button className='accept' onClick={() => {modifyFriend('pending', 'accepted', requestArray[0])}}>Accept</button>
                        <button className='decline' onClick={() => {modifyFriend('pending', 'declined', requestArray[0])}}>Decline</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
    </>)
}

export default NotificationsScreen