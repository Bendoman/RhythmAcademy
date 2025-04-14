import '../styles/session_screen.css';
import '../styles/menu_screens.css';
import '../styles/profile_screen.css';

import { UserContext } from '../App';
import { CloseButtonSVG } from '../../assets/svg/Icons';
import { useAppContext } from '../AppContextProvider';
import { modifyFriend, sendFriendRequest } from '../../scripts/helpers/supa-utils';
import { useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../../scripts/helpers/supa-client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from "@supabase/auth-ui-shared";


const ProfileScreen = () => {
    const { session } = useContext(UserContext);
    const { setShowProfileScreen, acceptedFriends, friendRequestStatus, setFriendRequestStatus } = useAppContext(); 
    
    const [formAction, setFormAction] = useState('login'); 
    const [selectedTab, setSelectedTab] = useState('profile');
    const friendEmailRef = useRef<HTMLInputElement | null>(null);
    
    const handleKeyDown = (event: KeyboardEvent) => {
        if(event.key != 'Escape') { return }
        setShowProfileScreen(false);
    }

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); }
    }, []);
    

    async function requestFriend() {
        if(friendEmailRef.current && friendEmailRef.current.value != '') {
            let status = await sendFriendRequest(friendEmailRef.current.value);
            setFriendRequestStatus(status); 
        } else {
            setFriendRequestStatus('No email provided');
        }
    }

    return (
        <div className="profile_screen screen">
            <div className="closeContainer"
            onClick={()=> { setShowProfileScreen(false); }}>
                <CloseButtonSVG/>
            </div>

            <div className="tabs">
                <div className={`tab ${selectedTab == 'profile' ? 'selected' : ''}`} 
                onClick={()=>{setSelectedTab('profile')}}><p>Profile</p></div>
                <div className={`tab ${selectedTab == 'friends' ? 'selected' : ''}`} 
                onClick={()=>{setSelectedTab('friends')}}>Friends</div>
            </div>

            <div className="profile_content">
            { selectedTab == 'profile' && 
            <> 
                { session?.user &&
                <div className='session_info'>
                    <p>User: {session?.user.email} logged in</p>
                    <button onClick={() => { supabase.auth.signOut(); }}>Signout</button>
                </div> }

                { !session?.user &&
                <div className='authentication_form_container'>
                    <div className="button_container">
                    <button className={`${formAction == 'login' ? 'selected' : ''}`}
                    onClick={() => { setFormAction('login') }}>Login</button>

                    <button className={`${formAction == 'signup' ? 'selected' : ''}`}
                    onClick={() => { setFormAction('signup')}}>Signup</button>
                    </div>

                    { formAction == 'signup' &&                     
                    <div className="signup">
                        <Auth
                        supabaseClient={supabase}
                        appearance={{
                            theme: ThemeSupa,
                            className: {
                            container: "auth-form-container",
                            label: "auth-form-label",
                            button: "auth-form-button",
                            input: "auth-form-input",
                            },
                        }}
                        providers={[]}
                        view={'sign_up'}
                        showLinks={false}/>
                    </div> }

                    { formAction == 'login' &&                     
                    <div className="login">
                        <Auth
                        supabaseClient={supabase}
                        appearance={{
                            theme: ThemeSupa,
                            className: {
                            container: "auth-form-container",
                            label: "auth-form-label",
                            button: "auth-form-button",
                            input: "auth-form-input",
                            },
                        }}
                        providers={[]}
                        view={'sign_in'}
                        showLinks={false}/>
                    </div> }
                
                </div> }
            </>}
            
            {selectedTab == 'friends' && 
            <div className="friends_tab">
                <div className="request_form_container">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        requestFriend();
                    }}>
                        <label htmlFor="friend_email_input">Friend request</label>
                        <p>{friendRequestStatus && friendRequestStatus}</p>

                        <div className="form_submit">
                        <input ref={friendEmailRef} id="friend_email_input" type="text" placeholder='Email'/>
                        <button type='submit'>send</button>
                        </div>
                    </form>
                </div>

                { acceptedFriends && acceptedFriends.map((requestArray, index) => (
                    <div key={index}>
                        <div className="friend_request">
                            <p>{`${requestArray[1]}`}</p>
                            <button className='decline' 
                            onClick={() => {modifyFriend('accepted', 'declined', requestArray[0])}}>
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
                
                { acceptedFriends && acceptedFriends.length == 0 && <p>Nobody here {`:(`}</p>}
            </div>}

            </div>
        </div>
    )
}

export default ProfileScreen
