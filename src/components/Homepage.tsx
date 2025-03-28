// Obsolete?
// import { Link, Navigate, redirect, Route } from 'react-router-dom'
// React
import React, { useEffect, useState, useContext, useRef } from 'react';
// Supabase
import { Auth } from '@supabase/auth-ui-react';
import { supabase } from '../scripts/supa-client.ts';
import { ThemeSupa } from "@supabase/auth-ui-shared";
// Custom components
import { UserContext } from "./App.tsx";
import RunControls, { RunControlsRef } from './run_controls/RunControls.tsx';
import AddLaneButton from './run_controls/AddLaneButton.tsx';

// Custom scripts and styles
import './styles/homepage.css';
import './styles/oldHomepage.css';

import { startLoop, handleMIDIMessage } from '../scripts/main.ts';
import StatsScreen from './StatsScreen.tsx';
import { StatsObject } from '../scripts/types.ts';
import SessionLoadScreen from './SessionLoadScreen.tsx';
import SessionSaveScreen from './SessionSaveScreen.tsx';
import { acceptPendingFriendRequest, retrievePendingFriendReqeusts, sendFriendRequest } from '../scripts/SupaUtils.ts';
// import { sendFriendRequest } from '../scripts/SupaUtils.ts';



export let midiAccess: MIDIAccess; 
const Homepage = () => {

    const updateDevices = (event: Event) => { console.log(event) } // Does not work in FireFox
    
    const processMidiMessage = (input: MIDIMessageEvent) => {
        handleMIDIMessage(input)
    }
    
    const midi_connection_success = (access: MIDIAccess) => {
        midiAccess = access; 
        console.log(midiAccess)
        midiAccess.onstatechange = updateDevices;

        const inputs = midiAccess.inputs; 
        inputs.forEach(input => { 
            input.addEventListener('midimessage', processMidiMessage);
        });
    }

    const midi_connection_failure = (error: Error) => {
        console.error("MIDI Connection failure: ", error);
    }

    const fetchPendingFriendRequests = async () => {
        let data = await retrievePendingFriendReqeusts();
        if(data) {
            let emailIDPairs: string[][] = []; 
            data.forEach(request => {
                console.log(request.sender.email);
                emailIDPairs.push([request.sender_id, request.sender.email])    
            });

            setPendingFriendRequests(emailIDPairs);
        }
    }

    const [pendingFriendRequests, setPendingFriendRequests] = useState<string[][]>([]);

    useEffect(() => {
        if(navigator.requestMIDIAccess) // Ensures that MIDI access is enabled in the current browser
            navigator.requestMIDIAccess().then(midi_connection_success, midi_connection_failure);
        else
            console.log("MIDI Access not supported on current browser");

        fetchPendingFriendRequests();
    }, []);

    const friendEmailRef = useRef<HTMLInputElement | null>(null);




    const { session } = useContext(UserContext);
    useEffect(() => {
        // TODO: UPDATE THIS SO THAT ACCOUNT CHANGES MID SESSION ARE HANDLED
        startLoop();
    }, []);

    const [signupDisplay, setSignupDisplay] = useState('none'); 
    const [loginDisplay, setLoginDisplay] = useState('none'); 

    const [showStats, setShowStats] = useState(false); 
    const [stats, setStats] = useState<StatsObject[]>([]);

    const [showSessionLoadScreen, setSessionLoadScreen] = useState(false); 
    const [showSessionSaveScreen, setSessionSaveScreen] = useState(false); 

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

            {pendingFriendRequests && pendingFriendRequests.map((requestArray, index) => (
                <div key={index}>
                    <p>{`${requestArray[1]}`}</p>
                    <button onClick={() => {acceptPendingFriendRequest(requestArray[0])}}>Accept</button>
                </div>
            ))}
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
            <input type="number" id="workspace_measure_count" value="400" min="1"/>
            </div>
            <button id="settings_panel_close">close</button>
        </div>

        <section id='content'>
            <RunControls setStats={setStats} setShowStats={setShowStats} setSessionLoadScreen={setSessionLoadScreen} setSessionSaveScreen={setSessionSaveScreen}
            showSessionLoadScreen={showSessionLoadScreen} showSessionSaveScreen={showSessionSaveScreen}
            ></RunControls>
            { showStats && <StatsScreen stats={stats} setShowStats={setShowStats}/> }
            { showSessionLoadScreen && <SessionLoadScreen setSessionLoadScreen={setSessionLoadScreen}/>}
            { showSessionSaveScreen && <SessionSaveScreen setSessionSaveScreen={setSessionSaveScreen}/>}
            <div id="lane_container">
            </div>
        </section>
    </>)
}

export default Homepage