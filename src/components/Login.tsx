import ImageSVG from '../../assets/clipart/floating-man.svg';

import { supabase } from "../scripts/supa-client.ts";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from "@supabase/auth-ui-shared";


import { Suspense, useContext } from "react";
import { UserContext } from "./App.tsx";
import { Navigate } from "react-router-dom";

// TODO Replace this with orignal SVG source ( SVGs downloaded from figma have long load times )
import CoverImage from '../../assets/clipart/floating-man.svg';

const Login = () => {
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

          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
