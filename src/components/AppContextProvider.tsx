import { StatsObject } from '../scripts/types';
import React, { createContext, useContext, useRef, useState } from 'react';

interface AppContextType {
  showLogo: boolean;
  setShowLogo: React.Dispatch<React.SetStateAction<boolean>>; 
  
  showStats: boolean;
  setShowStats: React.Dispatch<React.SetStateAction<boolean>>;
  
  stats: StatsObject[];
  setStats: React.Dispatch<React.SetStateAction<StatsObject[]>>;
  
  showToolTips: boolean;
  setShowToolTips: React.Dispatch<React.SetStateAction<boolean>>;
  
  showSessionLoadScreen: boolean;
  setSessionLoadScreen: React.Dispatch<React.SetStateAction<boolean>>;
  
  showSessionSaveScreen: boolean;
  setSessionSaveScreen: React.Dispatch<React.SetStateAction<boolean>>;
  
  showProfileScreen: boolean;
  setShowProfileScreen: React.Dispatch<React.SetStateAction<boolean>>;
  
  currentSessionName: string; 
  setCurrentSessionName: React.Dispatch<React.SetStateAction<string>>;
  
  showSettingsScreen: boolean;
  setShowSettingsScreen: React.Dispatch<React.SetStateAction<boolean>>;
  
  showSessionToolTip: boolean;
  setShowSessionToolTip: React.Dispatch<React.SetStateAction<boolean>>;
  
  notificationsNumber: number;
  setNotificationsNumber: React.Dispatch<React.SetStateAction<number>>;
  
  acceptedFriends: string[][];
  setAcceptedFriends: React.Dispatch<React.SetStateAction<string[][]>>;
  
  friendRequestStatus: string;
  setFriendRequestStatus: React.Dispatch<React.SetStateAction<string>>;
  
  currentSessionAltered: boolean;
  setCurrentSessionAltered: React.Dispatch<React.SetStateAction<boolean>>;
  
  showNotificationsScreen: boolean;
  setShowNotificationsScreen: React.Dispatch<React.SetStateAction<boolean>>;
  
  pendingFriendRequests: string[][];
  setPendingFriendRequests: React.Dispatch<React.SetStateAction<string[][]>>;

  isEditingRef: React.RefObject<boolean>
}

const AppContext = createContext<AppContextType | undefined>(undefined);  

export const AppContextProvider: React.FC<{children: React.ReactNode }> = ({ children }) => {
  const isEditingRef = useRef(false); 

  const [showLogo, setShowLogo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<StatsObject[]>([]);

  const [showToolTips, setShowToolTips] = useState(false);
  const [showSessionSaveScreen, setSessionSaveScreen] = useState(false);
  const [showSessionLoadScreen, setSessionLoadScreen] = useState(false);
  
  const [currentSessionName, setCurrentSessionName] = useState(''); 
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  
  const [notificationsNumber, setNotificationsNumber] = useState(0);
  const [showSessionToolTip, setShowSessionToolTip] = useState(false);
  const [acceptedFriends, setAcceptedFriends] = useState<string[][]>([]);
  
  const [friendRequestStatus, setFriendRequestStatus] = useState(''); 
  const [currentSessionAltered, setCurrentSessionAltered] = useState(false);
  const [showNotificationsScreen, setShowNotificationsScreen] = useState(false);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<string[][]>([]);

  return (
    <AppContext.Provider value={{
      showLogo, setShowLogo, isEditingRef,
      showToolTips, setShowToolTips,
      acceptedFriends, setAcceptedFriends,
      showProfileScreen, setShowProfileScreen,
      showStats, setShowStats, stats, setStats,
      showSessionToolTip, setShowSessionToolTip,
      showSettingsScreen, setShowSettingsScreen,
      currentSessionName, setCurrentSessionName,
      notificationsNumber, setNotificationsNumber,
      showSessionLoadScreen, setSessionLoadScreen,
      showSessionSaveScreen, setSessionSaveScreen,
      friendRequestStatus, setFriendRequestStatus,
      pendingFriendRequests, setPendingFriendRequests,
      currentSessionAltered, setCurrentSessionAltered,
      showNotificationsScreen, setShowNotificationsScreen}}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within a AppContextProvider");
  }
  return context;
};
