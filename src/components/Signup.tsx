import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from "@supabase/auth-ui-shared";

import { Suspense, useContext, useEffect, useState } from "react";
import { UserContext } from "./App.tsx";

import { supabase } from "../scripts/supa-client.ts";

// TODO Replace this with orignal SVG source ( SVGs downloaded from figma have long load times )
import CoverImage from '../../assets/clipart/man-climbing.svg';
import { Navigate } from 'react-router-dom';

const Signup = () => {
  const { session } = useContext(UserContext);

  if(session?.user)
  {
    return <Navigate to='/' />; 
  }

  return (
    <>
      <div className='auth-content signup-content'>
        <div className='signup-content'>
          <div className="signup-content-left">

            <div className="background-left"></div>
            <div className="auth-cover-wrapper">
              <Suspense fallback={<> <h2>LOADING</h2> </>}>
                {/* <img className='auth-cover-image' src={CoverImage} alt='logo' /> */}
              </Suspense>
            </div>
            <h1 className='tagline'>
              Helping you turn houses, into homes
            </h1>

          </div>

          <div className="signup-content-right">

          <div className="background-right">
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

          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
