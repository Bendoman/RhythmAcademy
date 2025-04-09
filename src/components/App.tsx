import Login from './Login.tsx';
import Signup from './Signup.tsx';
import Homepage from './Homepage.tsx';

import React from 'react'
import { createContext } from 'react';
import { UserInfo, useSession } from '../scripts/use-session.ts';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AppContextProvider } from './AppContextProvider.tsx';

const App = () => {
  const userInfo = useSession();
  return (
    <>
      <Router>
        <UserContext.Provider value={(userInfo)}>
        <AppContextProvider>
          <div className="content">
            <Routes>
              <Route path='/' element={<Homepage/>}/>
              <Route path='/signup' element={<Signup/>} />
              <Route path='/login' element={<Login/>} />
            </Routes>
          </div>
        </AppContextProvider>
        </UserContext.Provider>
      </Router>
    </>
  )
}

export const UserContext = createContext<UserInfo>({
    session: null,
    profile: null,
});

export default App;
