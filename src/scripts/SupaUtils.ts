import { supabase } from '../scripts/supa-client.ts';
import { FriendRequest } from './types.ts';

// TODO: Move all supabase data retrieval here.

export async function newRetrieveBucketList(bucket: string) {
const userId = (await supabase.auth.getUser()).data.user?.id as string;

  const { data, error } = await supabase.storage.from(bucket).list(userId); 

  if(!error)
      return [{ownerid: userId, data: data}]; 
}

// TODO: Merge these two and add pagination handling to friends bucket
export async function newnewRetrieveBucketList(bucket: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id as string;

    let allItems: any[] = [];
    let offset = 0;
    const limit = 100;
    let done = false;

    while (!done) {
        const { data, error } = await supabase.storage.from(bucket).list(userId, {
        limit,
        offset,
        });

        if (error) {
        console.error('Error fetching storage list:', error);
        return null;
        }

        if (data && data.length > 0) {
        allItems.push(...data);
        offset += limit;
        } else {
        done = true;
        }
    }

    return [{ ownerid: userId, data: allItems }];
}
  

// TODO: Conditionally retrieve friends list with parameter
export async function retrieveFriendBucketList(bucket: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id as string;

    const { data: friends, error: friendError } = await supabase
    .from('friend_requests')
    .select('sender_id, receiver_id')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('status', 'accepted');

    // 2. Extract unique friend IDs (exclude self to avoid duplication)
    const friendIds = new Set<string>();
    // friendIds.add(userId); // add self

    if(!friends)
        return; 

    for (const fr of friends) {
        if (fr.sender_id !== userId) friendIds.add(fr.sender_id);
        if (fr.receiver_id !== userId) friendIds.add(fr.receiver_id);
    }

    // 3. List files for each friend
    const allFiles = [];

    for (const id of friendIds) {
        const { data, error } = await supabase.storage.from(bucket).list(id);

        if (!error && data?.length) {
            allFiles.push({ownerid: id, data: data});
        }
    }

    return allFiles; 
}

export async function getEmailFromID(id: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id as string;

    // 1. Look up the receiver's user ID by email
    const { data: profiles, error: profileError } = await supabase
    .from('public_profiles')
    .select('email')
    .eq('id', id)
    .single();

    
    if (profileError || !profiles) 
        return 'User not found';

    return profiles.email;
}

export async function sendFriendRequest(email: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id as string;

    console.log(`Sending friend request to ${email}`);

    // 1. Look up the receiver's user ID by email
    const { data: profiles, error: profileError } = await supabase
    .from('public_profiles')
    .select('id')
    .eq('email', email)
    .single();

    if (profileError || !profiles) 
        return 'User not found';

    const receiverId = profiles.id;

    if(receiverId == userId)
        return "You can't send a friend request to yourself";

    // 3. Check if a friend request already exists in either direction
    const { data: existing, error: checkError } = await supabase
    .from('friend_requests')
    .select('id, status')
    .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${userId})`
    );

    if(checkError)
        return `Check Error while requesting: ${checkError.message}`; 

    if(existing && existing.length > 0) {
        return existing[0].status == 'pending' ? 'Pending friend request already exists' : 'You are already friends with this user';
    }
        
    // 4. Send the friend request
    const { error: insertError } = await supabase
        .from('friend_requests')
        .insert([{
            sender_id: userId,
            receiver_id: receiverId
        },
    ]);
    
    if(insertError)
        return `Insert Error while requesting: ${insertError.message}`; 

    return `Friend request sent to ${userId}`;
}


export async function retrieveFriendsList(status: string): Promise<FriendRequest[] | null> {
    const userId = (await supabase.auth.getUser()).data.user?.id as string;

    const { data, error } = await supabase
    .from('friend_requests')
    .select(`
    id,
    status,
    created_at,
    sender_id,
    sender:public_profiles (
        email
    )`)
    .eq('receiver_id', userId)
    .eq('status', status)
    .order('created_at', { ascending: false });

    if(!data) return null; 

    // @ts-ignore 
    return data as FriendRequest[];
}

export async function modifyFriend(currentStatus: string, newStatus: string, senderId: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id as string;

    const { data, error } = await supabase
        .from('friend_requests')
        .update({ status: newStatus })
        .match({
        sender_id: senderId,
        receiver_id: userId,
        status: currentStatus,
    });

    // TODO: Handle this
    console.log(data, error);
}
