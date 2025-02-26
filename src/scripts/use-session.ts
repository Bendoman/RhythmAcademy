import { RealtimeChannel, Session } from "@supabase/supabase-js";
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
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUserInfo({ ...userInfo, session });
            supabase.auth.onAuthStateChange((_event, session) => {
                setUserInfo({ session, profile: null });
            });
        });
    }, []);


    // TODO: Review if the below code has any use
    // useEffect(() => {
    //     if (userInfo.session?.user && !userInfo.profile) {
    //         listenToUserProfileChanges(userInfo.session.user.id).then(
    //             (newChannel) => {
    //                 if (channel) {
    //                     channel.unsubscribe();
    //                 }
    //                 setChannel(newChannel);
    //             }
    //         );
    //     } else if (!userInfo.session?.user) {
    //         channel?.unsubscribe();
    //         setChannel(null);
    //     }
    // }, [userInfo.session]);

    // async function listenToUserProfileChanges(userId: string) {
    //     const { data } = await supaClient
    //         .from("user_profiles")
    //         .select("*")
    //         .filter("user_id", "eq", userId);
    //     if (data?.[0]) {
    //         setUserInfo({ ...userInfo, profile: data?.[0] });
    //     }
    //     return supaClient
    //         .channel(`public:user_profiles`)
    //         .on(
    //             "postgres_changes",
    //             {
    //                 event: "*",
    //                 schema: "public",
    //                 table: "user_profiles",
    //                 filter: `user_id=eq.${userId}`,
    //             },
    //             (payload) => {
    //                 setUserInfo({ ...userInfo, profile: payload.new as UserProfile });
    //             }
    //         )
    //         .subscribe();
    // }

    return userInfo;
}