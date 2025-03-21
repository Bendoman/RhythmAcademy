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
import AddLaneButton, { AddLaneButtonRef } from './run_controls/AddLaneButton.tsx';

// Custom scripts and styles
import './styles/homepage.css';
import './styles/oldHomepage.css';

import { startLoop, handleMIDIMessage } from '../scripts/main.ts';
import StatsScreen from './StatsScreen.tsx';
import { StatsObject } from '../scripts/types.ts';


const Homepage = () => {
    const runControlsRef = useRef<RunControlsRef | null>(null);

    const updateDevices = (event: Event) => { console.log(event) } // Does not work in FireFox
    
    const processMidiMessage = (input: MIDIMessageEvent) => {
        if(runControlsRef.current) 
            runControlsRef.current.processMidiMessage(input);
        handleMIDIMessage(input)
    }
    
    const midi_connection_success = (midiAccess: MIDIAccess) => {
        midiAccess.onstatechange = updateDevices;

        const inputs = midiAccess.inputs; 
        inputs.forEach(input => { input.onmidimessage = processMidiMessage})
    }

    const midi_connection_failure = (error: Error) => {
        console.error("MIDI Connection failure: ", error);
    }

    useEffect(() => {
        if(navigator.requestMIDIAccess) // Ensures that MIDI access is enabled in the current browser
            navigator.requestMIDIAccess().then(midi_connection_success, midi_connection_failure);
        else
            console.log("MIDI Access not supported on current browser");
    }, []);

    const { session } = useContext(UserContext);
    useEffect(() => {
        // TODO: UPDATE THIS SO THAT ACCOUNT CHANGES MID SESSION ARE HANDLED
        startLoop();
    }, []);

    const [signupDisplay, setSignupDisplay] = useState('none'); 
    const [loginDisplay, setLoginDisplay] = useState('none'); 

    const [showStats, setShowStats] = useState(false); 
    const [stats, setStats] = useState<StatsObject[]>([]);

    return (<>
        { session?.user &&
        <div className='session_info'>
            <p>User {session?.user.email} logged in</p>
            <p>User ID = {session?.user.id}</p>
            <button onClick={() => { supabase.auth.signOut(); }}>Signout</button>
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
            <RunControls ref={runControlsRef} setStats={setStats} setShowStats={setShowStats}></RunControls>
            { showStats && <StatsScreen stats={stats} setShowStats={setShowStats}/> }
            <div id="lane_container">
            </div>
        </section>
    </>)
}

export default Homepage