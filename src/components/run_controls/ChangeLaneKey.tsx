import React, { useEffect, useRef, useState } from 'react'
import '../styles/laneContent.css';
import Lane from '../../scripts/Lane';
import { assignLaneInput, drawSingleLane, findLaneFromCanvas } from '../../scripts/main';

interface IChangeLaneKeyProps {
    canvas: HTMLCanvasElement;
}

const ChangeLaneKey: React.FC<IChangeLaneKeyProps> = ({ canvas }) => {
    const [listening, setListening] = useState(false);
    const listeningRef = useRef("not_listening");

    const [inputValue, setInputValue] = useState("Input key...");
    const inputValueRef = useRef("Input key...");

    const buttonRef = useRef<HTMLButtonElement>(null);
    

    const handleKeyDown = useRef((event: KeyboardEvent) => {   
        if(event.key == 'space' || event.key == ' ')
            event.preventDefault(); 

        if(!listeningRef.current || listeningRef.current != "listening") 
            return; 

        setInputValue(event.key);
        setListening(false);
        listeningRef.current = "not_listening";
        buttonRef.current?.blur(); 

        console.log(event); 

        assignLaneInput(lane, event.key); 
    });

    useEffect(() => {
        // Handler and references used so that event listener 
        // only has to be mounted once, not on ever state chagne
        const keyDownHandler = (event: KeyboardEvent) => handleKeyDown.current(event); 
        window.addEventListener("keydown", keyDownHandler)
        return () => { window.removeEventListener("keydown", keyDownHandler) }
    }, [])
    

    const lane: Lane = findLaneFromCanvas(canvas);
    console.log(lane); 

    return (<>
    <div className="change_lane_key">

    <button title="Listen for input key"
        ref={buttonRef}
        onFocus={() => {
            setInputValue("Listening...")
            setListening(true);
            listeningRef.current = "listening"; 
        }}
        onBlur={() => {
            if(listeningRef.current == "listening") {
              setInputValue("Input key...");
              setListening(false);
              listeningRef.current = "not_listening"; 
              console.log(listening)
            }
          }}  
        >
        Assign Input
        {/* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-keyboard"><path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/></svg> */}
    </button>


    </div>
    </> 
    )
}

export default ChangeLaneKey