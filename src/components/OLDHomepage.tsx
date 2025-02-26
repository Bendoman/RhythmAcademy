import React, { useEffect } from 'react'
import { Suspense, useContext } from "react";
import { UserContext } from "./App.tsx";
import { Link, Navigate, redirect, Route } from 'react-router-dom'
import { supabase } from '../scripts/supa-client.ts';
import { Session } from '@supabase/supabase-js';

const jsooon = {
  "name": "John",
  "age": 30,
  "isStudent": false
}

const strinifiedJSON = JSON.stringify(jsooon);

async function testUpload() {
  const { data: user, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.user) {
    console.error("User not authenticated", userError);
    return;
  }

  console.log(user.user.id);

  const {error } = await supabase.storage
  .from("private_storage")
  .upload(`${user.user.id}/test2.json`, new Blob([strinifiedJSON]), { 
    contentType: "application/json", 
    upsert: false, 
  });

  if(error) {
    console.log("Error uploading file ", error);
  } else {
    console.log("File uploaded");
  }
}

async function insert_test_data(session: Session) {
  const { data: user, error: userError } = await supabase.auth.getUser();
  console.log(user); 
  console.log(session?.user.id, session?.user.email);

  await supabase.from('test_table')
  .insert([
    { user_id: session?.user.id, email: session?.user.email},
  ]);
}

async function read_test_data(session: Session) {
  const { data, error } = await supabase.from('test_table').select();
  console.log(data, error); 
}

async function testAccess() {
  const { data: user, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.user) {
    console.error("User not authenticated", userError);
    return;
  }

  const { data, error } = await supabase
  .storage
  .from('private_storage')
  .download(`4d429f03-2dfb-4c44-a09f-65fb464c8b4a/test2.json`)

  if(error) {
    console.log(error);
  }

  if(data) {
    const text = await data.text();  // Read the file content as text
    const jsonData = JSON.parse(text);  // Parse the text as JSON

    console.log(jsonData);  // Output the parsed JSON
  }

}

const Homepage = () => {
  const { session } = useContext(UserContext);
  // console.log(session?.user)

  useEffect(() => {
    // testAccess();
    // testUpload();
    // testAccess();

  }, []); // Empty dependency array ensures it runs only once

  
  return (
    <>
      <div>Homepage</div>
      
      {
        session?.user &&
        <>
          User {session?.user.email} logged in


        </>
      }

      <Link to='/' className='navbar-button dashboard-navbar-button' onClick={() => { supabase.auth.signOut(); }}>Sign out</Link>
      <br></br>
      <Link to='signup'>Signup</Link>
      <br></br>
      <Link to='login'>Login</Link>

      <button onClick={() => { if(session) { insert_test_data(session); } }}>Click me to write</button>

      <button onClick={() => { if(session) { read_test_data(session); } }}>Click me to read</button>
    </>
  )
}

export default Homepage;