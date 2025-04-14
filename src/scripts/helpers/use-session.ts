import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "./supa-client";

export interface UserProfile {
    username: string;
    avatarUrl?: string;
}

export interface UserInfo {
    session: Session | null;
    profile: UserProfile | null;
}

export function useSession(): UserInfo {
    const [userInfo, setUserInfo] = useState<UserInfo>({
        profile: null,
        session: null,
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUserInfo({ ...userInfo, session });
            supabase.auth.onAuthStateChange((_event, session) => {
                setUserInfo({ session, profile: null });
            });
        });
    }, []);
    return userInfo;
}
