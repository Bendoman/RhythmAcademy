// #region ( Imports )
import { useEffect, useContext } from 'react';
import { supabase } from '../scripts/helpers/supa-client.ts';
// Custom components
import Lane from '../scripts/classes/Lane.ts';
import { UserContext } from "./App.tsx";
import { useAppContext } from './AppContextProvider.tsx';
import StatsScreen from './menu_screens/StatsScreen.tsx';
import RunControls from './run_controls/RunControls.tsx';
import ProfileScreen from './menu_screens/ProfileScreen.tsx';
import SettingsScreen from './menu_screens/SettingsScreen.tsx';
import SessionSaveScreen from './menu_screens/SessionSaveScreen.tsx';
import NotificationsScreen from './menu_screens/NotificationsScreen.tsx';
import SessionLoadScreen, { createNewLane } from './menu_screens/SessionLoadScreen.tsx';
// Custom scripts and styles
import './styles/homepage.css';
import './styles/variables.css';
import { loadFromLocalStorage, saveToLocalStorage } from '../scripts/helpers/utils.ts';
import { retrieveFriendsList } from '../scripts/helpers/supa-utils.ts';
import { startLoop, handleMIDIMessage, lanes, remapLane } from '../scripts/main.ts';
import Logo from '../assets/svg/Logo.tsx';
// #endregion

export let midiAccess: MIDIAccess; 
const Homepage = () => {
    const { session } = useContext(UserContext);
    const { 
        showStats, showSessionLoadScreen, showSessionSaveScreen, 
        setShowToolTips, setPendingFriendRequests, setAcceptedFriends,
        showSettingsScreen, showProfileScreen, showNotificationsScreen, 
        setNotificationsNumber, showLogo, setShowLogo, isEditingRef
    } = useAppContext();
   
    // #region ( MIDI Setup )
    const processMidiMessage = (input: MIDIMessageEvent) => { handleMIDIMessage(input) }

    const updateDevices = (event: MIDIConnectionEvent) => { 
        if(event.port?.state == 'connected' && event.port.type === 'input') {
            const input = midiAccess.inputs.get(event.port.id);
            if(input) {
                input.addEventListener('midimessage', processMidiMessage);
            }
        }
    } 

    const midi_connection_success = (access: MIDIAccess) => {
        midiAccess = access; 
        midiAccess.onstatechange = updateDevices;

        const inputs = midiAccess.inputs; 
        inputs.forEach(input => { input.addEventListener('midimessage', processMidiMessage); });
    }

    const midi_connection_failure = (error: Error) => { console.error("MIDI Connection failure: ", error) }
    // #endregion

    // #region ( Friend Handling)
    const fetchFriendsList = async (status: string) => {
        let data = await retrieveFriendsList(status);

        if(data) {
            let requestInfo: string[][] = []; 
            data.forEach(request => {
                requestInfo.push([request.sender_id, request.sender.email, request.created_at])    
            });

            if(status == 'pending') {
                setPendingFriendRequests(requestInfo);
                setNotificationsNumber(requestInfo.length);
            } else if(status == 'accepted') {
                setAcceptedFriends(requestInfo); 
            }
        }
    }
    // #endregion

    // #region ( useEffects )
    useEffect(() => {
        // Runs on component mount
        startLoop();

        setShowLogo(true); 
        const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
        if (navEntries.length > 0 && navEntries[0].type === "reload") {
            // Page reloaded
            let current_session: {lanes: Lane[]} | null = loadFromLocalStorage<{lanes: Lane[]}>('current_session');
            if(current_session) {
                // Loads current session from local storage if it is present
                current_session.lanes.forEach(lane => {
                    createNewLane(lane.inputKey, setShowLogo);
                    remapLane(lanes[lanes.length - 1], lane);
                    setShowLogo(false); 
                });
            }
            setShowToolTips(false);
        } else {
            // Overwriting current_session on first startup
            setShowToolTips(true);
            saveToLocalStorage('stats', '');
            saveToLocalStorage('current_session', '');
        }
        
        const { data: listener } = supabase.auth.onAuthStateChange((event) => {
            if(isEditingRef.current) {
                // Ensures that saved pattern and lane data is repopulated correctly after auth change
                // window.location.reload();
            }

            if(event === 'SIGNED_OUT') {
                setAcceptedFriends([]);
                setNotificationsNumber(0); 
                setPendingFriendRequests([]);
            }
        });   

        // Ensures that MIDI access is enabled in the current browser
        if(navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess({ sysex: false }).then(midi_connection_success, midi_connection_failure);
        } else {
            console.warn("MIDI Access not supported on current browser");
        }

        // Detects when lane_container is empty


        return () => { listener.subscription.unsubscribe(); };
    }, []);

    useEffect(() => {
        if(session) {
            // Rerequests friends list on session change
            fetchFriendsList('pending');
            fetchFriendsList('accepted');
            const channel = supabase
            .channel('incoming_friend_requests')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'friend_requests',
                filter: `receiver_id=eq.${session?.user.id}`, // listen only to requests for this user
            }, () => { fetchFriendsList('pending'); fetchFriendsList('accepted'); }).subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [session]);
    // #endregion

    return (<>
        {/* <div id="debug_text">
            <p id="ups_paragraph">0</p>
            <button id="enable_audio">Enable audio</button>
        </div> */}

        <section id='content'>
            <RunControls />
            { showStats && <StatsScreen/> }
            { showSessionLoadScreen && <SessionLoadScreen/>}
            { showSessionSaveScreen && <SessionSaveScreen/>}
            { showProfileScreen && <ProfileScreen/> }
            { showNotificationsScreen && <NotificationsScreen/>}
            { showSettingsScreen && <SettingsScreen/>}

            <div id="lane_container"> 
                { showLogo && <Logo/>}
            </div>
        </section>
    </>)
}

export default Homepage