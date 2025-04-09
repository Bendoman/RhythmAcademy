import React, { createContext, useContext, useState } from 'react';
import { StatsObject } from '../scripts/types';

interface AppContextType {
  stats: StatsObject[];
  setStats: React.Dispatch<React.SetStateAction<StatsObject[]>>;
  
  showStats: boolean;
  setShowStats: React.Dispatch<React.SetStateAction<boolean>>;
  
  showSessionLoadScreen: boolean;
  setSessionLoadScreen: React.Dispatch<React.SetStateAction<boolean>>;

  showSessionSaveScreen: boolean;
  setSessionSaveScreen: React.Dispatch<React.SetStateAction<boolean>>;

  showProfileScreen: boolean;
  setShowProfileScreen: React.Dispatch<React.SetStateAction<boolean>>;

  showNotificationsScreen: boolean;
  setShowNotificationsScreen: React.Dispatch<React.SetStateAction<boolean>>;

  notificationsNumber: number;
  setNotificationsNumber: React.Dispatch<React.SetStateAction<number>>;

  showSettingsScreen: boolean;
  setShowSettingsScreen: React.Dispatch<React.SetStateAction<boolean>>;

  friendRequestStatus: string;
  setFriendRequestStatus: React.Dispatch<React.SetStateAction<string>>;
  
  showToolTips: boolean;
  setShowToolTips: React.Dispatch<React.SetStateAction<boolean>>;

  showSessionToolTip: boolean;
  setShowSessionToolTip: React.Dispatch<React.SetStateAction<boolean>>;

  pendingFriendRequests: string[][];
  setPendingFriendRequests: React.Dispatch<React.SetStateAction<string[][]>>;

  acceptedFriends: string[][];
  setAcceptedFriends: React.Dispatch<React.SetStateAction<string[][]>>;

  currentSessionName: string; 
  setCurrentSessionName: React.Dispatch<React.SetStateAction<string>>;
  
  currentSessionAltered: boolean;
  setCurrentSessionAltered: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);  

export const AppContextProvider: React.FC<{children: React.ReactNode }> = ({ children }) => {
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<StatsObject[]>([]);
  const [showSessionLoadScreen, setSessionLoadScreen] = useState(false);
  const [showSessionSaveScreen, setSessionSaveScreen] = useState(false);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [showNotificationsScreen, setShowNotificationsScreen] = useState(false);
  const [notificationsNumber, setNotificationsNumber] = useState(0);
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState(''); 
  const [showToolTips, setShowToolTips] = useState(false);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<string[][]>([]);
  const [acceptedFriends, setAcceptedFriends] = useState<string[][]>([]);
  const [currentSessionName, setCurrentSessionName] = useState(''); 
  const [currentSessionAltered, setCurrentSessionAltered] = useState(false);
  const [showSessionToolTip, setShowSessionToolTip] = useState(false);

  return (
    <AppContext.Provider value={{
      showStats, setShowStats, stats, setStats,
      showSessionLoadScreen, setSessionLoadScreen,
      showSessionSaveScreen, setSessionSaveScreen,
      showProfileScreen, setShowProfileScreen,
      showNotificationsScreen, setShowNotificationsScreen,
      notificationsNumber, setNotificationsNumber,
      showSettingsScreen, setShowSettingsScreen,
      friendRequestStatus, setFriendRequestStatus,
      showToolTips, setShowToolTips,
      pendingFriendRequests, setPendingFriendRequests,
      acceptedFriends, setAcceptedFriends,
      currentSessionName, setCurrentSessionName,
      currentSessionAltered, setCurrentSessionAltered,
      showSessionToolTip, setShowSessionToolTip
    }}>
      {children}
    </AppContext.Provider>)
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within a AppContextProvider");
  }
  return context;
};
