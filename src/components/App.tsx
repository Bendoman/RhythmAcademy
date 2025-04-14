import Homepage from './Homepage.tsx';

import { createContext } from 'react';
import { AppContextProvider } from './AppContextProvider.tsx';
import { UserInfo, useSession } from '../scripts/helpers/use-session.ts';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

const App = () => {
  const userInfo = useSession();
  return (
    <Router>
      <UserContext.Provider value={(userInfo)}>
      <AppContextProvider>
        <div className="content">
          <Routes>
            <Route path='/' element={<Homepage/>}/>
          </Routes>
        </div>
      </AppContextProvider>
      </UserContext.Provider>
    </Router>
  )
}

export const UserContext = createContext<UserInfo>({
    session: null,
    profile: null,
});

export default App;
