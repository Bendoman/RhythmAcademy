import React, { useEffect } from 'react'
// TODO: Refactor this name
import './styles/session_screen.css';

interface INotificationsScreenProps {
    setShowNotificationsScreen: React.Dispatch<React.SetStateAction<boolean>>;
    setNotificationsNumber: React.Dispatch<React.SetStateAction<number>>;
}

const NotificationsScreen: React.FC<INotificationsScreenProps> = ({ setShowNotificationsScreen, setNotificationsNumber}) => {
    useEffect(() => {
        setNotificationsNumber(5); 
    }, []);

    return (<>
    <div className="notifications_screen">
        Notifications
    </div>
    </>)
}

export default NotificationsScreen