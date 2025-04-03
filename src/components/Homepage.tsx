// React
import React, { useEffect, useState, useContext, useRef } from 'react';
// Supabase
import { Auth } from '@supabase/auth-ui-react';
import { supabase } from '../scripts/supa-client.ts';
import { ThemeSupa } from "@supabase/auth-ui-shared";
// Custom components

// Custom scripts and styles
import './styles/homepage.css';
import './styles/oldHomepage.css';

import Lane from '../scripts/Lane.ts';
import { UserContext } from "./App.tsx";
import StatsScreen from './StatsScreen.tsx';
import ProfileScreen from './ProfileScreen.tsx';
import { StatsObject } from '../scripts/types.ts';
import SessionSaveScreen from './SessionSaveScreen.tsx';
import RunControls from './run_controls/RunControls.tsx';
import NotificationsScreen from './NotificationsScreen.tsx';
import SessionLoadScreen, { createNewLane } from './SessionLoadScreen.tsx';
import { loadFromLocalStorage, saveToLocalStorage } from '../scripts/Utils.ts';
import { startLoop, handleMIDIMessage, lanes, remapLane, setLongestLane } from '../scripts/main.ts';
import { retrieveFriendsList, sendFriendRequest } from '../scripts/SupaUtils.ts';

export let midiAccess: MIDIAccess; 
const Homepage = () => {
    const processMidiMessage = (input: MIDIMessageEvent) => {
        handleMIDIMessage(input);
    }

    const updateDevices = (event: MIDIConnectionEvent) => { 
        // TODO: Implement hotswapping of MIDI devices here
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

    const midi_connection_failure = (error: Error) => {
        console.error("MIDI Connection failure: ", error);
    }

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

    const [pendingFriendRequests, setPendingFriendRequests] = useState<string[][]>([]);
    const [acceptedFriends, setAcceptedFriends] = useState<string[][]>([]);

    useEffect(() => {
        // TODO: UPDATE THIS SO THAT ACCOUNT CHANGES MID SESSION ARE HANDLED
        startLoop();

        const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
        if (navEntries.length > 0 && navEntries[0].type === "reload") {
            // Page reloaded
            // loadSessionFromLocalStorage();
            let current_session: {lanes: Lane[]} | null = loadFromLocalStorage<{lanes: Lane[]}>('current_session');
            if(current_session) {
                current_session.lanes.forEach(lane => {
                    createNewLane(lane.inputKey);
                    remapLane(lanes[lanes.length - 1], lane);
                    // setLongestLane();
                });
            }
        } else {
            // Overwriting current_session on startup
            saveToLocalStorage('current_session', '');
        }
        
        // Reload the page on auth state change 
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            // console.log(event); 
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                // TODO: See if reloading is necessary at all
                // window.location.reload(); 
            } 
            
            if(event === 'SIGNED_OUT') {
                setNotificationsNumber(0); 
                setPendingFriendRequests([]);
                setAcceptedFriends([]);
            }
        });   

        if(navigator.requestMIDIAccess) // Ensures that MIDI access is enabled in the current browser
            navigator.requestMIDIAccess({ sysex: false }).then(midi_connection_success, midi_connection_failure);
        else
            console.log("MIDI Access not supported on current browser");

        return () => { listener.subscription.unsubscribe(); };
    }, []);

    const { session } = useContext(UserContext);
    useEffect(() => {
        if(session) {
            fetchFriendsList('pending');
            fetchFriendsList('accepted');
            const channel = supabase
            .channel('incoming_friend_requests')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'friend_requests',
                    filter: `receiver_id=eq.${session?.user.id}`, // listen only to requests for this user
                },
                () => { fetchFriendsList('pending'); fetchFriendsList('accepted'); }
            )
            .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [session])

    const friendEmailRef = useRef<HTMLInputElement | null>(null);

    const [signupDisplay, setSignupDisplay] = useState('none'); 
    const [loginDisplay, setLoginDisplay] = useState('none'); 

    const [showStats, setShowStats] = useState(false); 
    const [stats, setStats] = useState<StatsObject[]>([]);

    const [showSessionLoadScreen, setSessionLoadScreen] = useState(false); 
    const [showSessionSaveScreen, setSessionSaveScreen] = useState(false); 

    const [showProfileScreen, setShowProfileScreen] = useState(false);
    const [showNotificationsScreen, setShowNotificationsScreen] = useState(false);
    const [notificationsNumber, setNotificationsNumber] = useState(0);

    const [friendRequestStatus, setFriendRequestStatus] = useState(''); 

    async function requestFriend() {
        if(friendEmailRef.current && friendEmailRef.current.value != '') {
            console.log(friendRequestStatus)
            let status = await sendFriendRequest(friendEmailRef.current.value);
            setFriendRequestStatus(status); 
        } else {
            setFriendRequestStatus('No email provided');
        }
    }

    return (<>
        { session?.user &&
        <div className='session_info'>
            <p>User {session?.user.email} logged in</p>
            <p>User ID = {session?.user.id}</p>
            <button onClick={() => { supabase.auth.signOut(); }}>Signout</button>

            <form onSubmit={(e) => {
                e.preventDefault();
                requestFriend();
            }}>
                <label htmlFor="friend_email_input">Friend request</label>
                <input ref={friendEmailRef} id="friend_email_input" type="text" placeholder='Email'/>
                <button type='submit'>send</button>
                <p>{friendRequestStatus && friendRequestStatus}</p>
            </form>
        </div> }

        { !session?.user &&
        <div className='session_info'>
            {/* <Link to='login'>Login</Link> */}
            <a onClick={() => {
                setLoginDisplay(loginDisplay == 'none' ? 'block' : 'none');  
                if(signupDisplay == 'block')
                    setSignupDisplay('none');             
            }}>Login</a>

            {/* <Link to='signup'>Signup</Link> */}
            <a onClick={() => {
                setSignupDisplay(signupDisplay == 'none' ? 'block' : 'none');     
                if(loginDisplay == 'block')
                    setLoginDisplay('none');          
                }}>Signup</a>
            <div className="signup" style={{display: signupDisplay}}>
            <Auth
                supabaseClient={supabase}
                appearance={{
                    theme: ThemeSupa,
                    className: {
                    container: "signup-form-container",
                    label: "signup-form-label",
                    button: "signup-form-button",
                    input: "signup-form-input",
                    },
                }}
                providers={[]}
                view={'sign_up'}
                showLinks={false}
            />
          </div>

          <div className="login" style={{display: loginDisplay}}>
                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        className: {
                        container: "signup-form-container",
                        label: "signup-form-label",
                        button: "signup-form-button",
                        input: "signup-form-input",
                        },
                        variables: {
                        default: {
                            colors: {
                            brand: 'blue',
                            brandAccent: 'var(--primary-light)',
                            },
                        },
                        },
                    }}
                    providers={[]}
                    view={'sign_in'}
                    showLinks={false}
                />
            </div>  
        </div> }
        
        <div id="debug_text">
            <p id="ups_paragraph">0</p>
            <button id="enable_audio">Enable audio</button>
        </div>

        <div id="settings_panel">
            <div id="workspace_measure_count_container">
            <label htmlFor="workspace_measure_count">Session length (measures)</label>
            <input type="number" id="workspace_measure_count" defaultValue="400" min="1"/>
            </div>
            <button id="settings_panel_close">close</button>
        </div>

        <section id='content'>
            <RunControls 
            setStats={setStats} setShowStats={setShowStats} setSessionLoadScreen={setSessionLoadScreen} setSessionSaveScreen={setSessionSaveScreen} showSessionLoadScreen={showSessionLoadScreen} showSessionSaveScreen={showSessionSaveScreen} showProfileScreen={showProfileScreen} 
            setShowProfileScreen={setShowProfileScreen} showNotificationsScreen={showNotificationsScreen}
            notificationsNumber={notificationsNumber} setShowNotificationsScreen={setShowNotificationsScreen} 
            ></RunControls>

            { showStats && <StatsScreen stats={stats} setShowStats={setShowStats}/> }
            { showSessionLoadScreen && <SessionLoadScreen setSessionLoadScreen={setSessionLoadScreen}/>}
            { showSessionSaveScreen && <SessionSaveScreen setSessionSaveScreen={setSessionSaveScreen}/>}
            { showProfileScreen && <ProfileScreen setShowProfileScreen={setShowProfileScreen} acceptedFriends={acceptedFriends}/> }
            { showNotificationsScreen && <NotificationsScreen setNotificationsNumber={setNotificationsNumber}setShowNotificationsScreen={setShowNotificationsScreen} pendingFriendRequests={pendingFriendRequests}/>}

            <div id="lane_container"/>
        </section>
    </>)
}

export default Homepage