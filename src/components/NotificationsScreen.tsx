import React, { useEffect } from 'react'
// TODO: Refactor this name
import './styles/session_screen.css';

interface INotificationsScreenProps {
    setShowNotificationsScreen: React.Dispatch<React.SetStateAction<boolean>>;
    setNotificationsNumber: React.Dispatch<React.SetStateAction<number>>;
}

const NotificationsScreen: React.FC<INotificationsScreenProps> = ({ setShowNotificationsScreen, setNotificationsNumber}) => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if(event.key != 'Escape')
            return; 
        setShowNotificationsScreen(false);
    }
    
    useEffect(() => {
        setNotificationsNumber(5); 
        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); }
    }, []);

    return (<>
    <div className="notifications_screen">
        Notifications
    </div>
    </>)
}

export default NotificationsScreen