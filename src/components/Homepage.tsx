// Obsolete?
// import { Link, Navigate, redirect, Route } from 'react-router-dom'
// React
import React, { useEffect, useState, useContext } from 'react';
// Supabase
import { Auth } from '@supabase/auth-ui-react';
import { supabase } from '../scripts/supa-client.ts';
import { ThemeSupa } from "@supabase/auth-ui-shared";
// Custom components
import { UserContext } from "./App.tsx";
import PlayButton from './run_controls/PlayButton.tsx';
import PauseButton from './run_controls/PauseButton.tsx';
import StopButton from './run_controls/StopButton.tsx';
import EditButton from './run_controls/EditButton.tsx';
import AddLaneButton from './run_controls/AddLaneButton.tsx';

// Custom scripts and styles
import './styles/oldHomepage.css';
import { startLoop, onAddLaneButtonClick } from '../scripts/main.ts';

const Homepage = () => {
    const { session } = useContext(UserContext);
    useEffect(() => {
        startLoop();
    }, []);

    const [signupDisplay, setSignupDisplay] = useState('none'); 
    const [loginDisplay, setLoginDisplay] = useState('none'); 

    const [isPaused, setIsPaused] = useState(true); 
    const [isPlaying, setIsPlaying] = useState(false);
    const [isStopped, setIsStopped] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

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
        
        {/* className */}
        <div id="run_controls" className="">
            <div id="button_container">
                {/* Should these be their own components? */}
                <PlayButton 
                isPlaying={isPlaying}
                onComponentClick={() => {
                    if(!isEditing && !isPlaying) { 
                        setIsPlaying(true); 
                        setIsPaused(false);
                        setIsStopped(false);
                        return true; 
                    } else return false; 
                }}></PlayButton>

                <PauseButton 
                isPaused={isPaused}
                onComponentClick={() => {
                    if(!isEditing && !isPaused) {
                        setIsPaused(true);
                        setIsPlaying(false);
                        setIsStopped(false);
                        return true;
                    } else return false;
                }}></PauseButton>

                <StopButton 
                isStopped={isStopped}
                onComponentClick={() => {
                    if(!isEditing && !isStopped) {
                        setIsStopped(true);
                        setIsPlaying(false);
                        setIsPaused(false);
                        return true;
                    } else return false;
                }}></StopButton>

                <EditButton 
                isEditing={isEditing}
                onComponentClick={() => {
                    if(!isPlaying) {
                        setIsEditing(!isEditing);
                        setIsPlaying(false);
                        setIsStopped(false);
                        setIsPaused(false);
                        return true;
                    } else return false;
                }}></EditButton>

                {/* 
                Should this be a component?
                Yes, return canvas container and new Lane obejct from create new lane function. 
                return canvas container and new Lane object from add button click function. 
                within add lane button component, createRoot(canvasContainer), root.render <Editing component>.
                import Lane to add lane button so that it can take the lane return value and populate editing component accordingly using interface props. 
                 */}
                {/* <button id="add_lane_button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-plus"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
                </button> */}
                <AddLaneButton></AddLaneButton>


                <button id="settings_button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
            </div>
        </div>
        <div id="lane_container">
        </div>
        </section>
    </>)
}

export default Homepage