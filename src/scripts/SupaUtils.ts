import { supabase } from '../scripts/supa-client.ts';

// TODO: Move all supabase data retrieval here.

export async function newRetrieveBucketList(bucket: string) {
const userId = (await supabase.auth.getUser()).data.user?.id as string;

  const { data, error } = await supabase.storage.from(bucket).list(userId); 

  if(!error)
      return [{ownerid: userId, data: data}]; 
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

// export async function sendFriendRequest(email: string) {
//     const userId = (await supabase.auth.getUser()).data.user?.id as string;

//     const { data, error } = await supabase
//     .from('friend_requests')
//     .insert([{ sender_id: userId, receiver_id: receiverId, status: 'pending' }]);

//     console.log(email);
// }