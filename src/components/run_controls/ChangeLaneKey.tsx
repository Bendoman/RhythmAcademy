import React, { useEffect, useRef, useState } from 'react'
import '../styles/laneContent.css';
import Lane from '../../scripts/Lane';
import { assignLaneInput, drawSingleLane, findLaneFromCanvas } from '../../scripts/main';
import { midiAccess } from '../Homepage';

interface IChangeLaneKeyProps {
    canvas: HTMLCanvasElement;
}

const ChangeLaneKey: React.FC<IChangeLaneKeyProps> = ({ canvas }) => {
    
    const lane: Lane = findLaneFromCanvas(canvas);
    const [listening, setListening] = useState(false);
    const listeningRef = useRef(false);

    const buttonRef = useRef<HTMLButtonElement>(null);


    const processMidiMessage = (input: MIDIMessageEvent) => {
        if(!listeningRef.current) return; 

        const inputData = input.data; 
        if(inputData == null) return; 

        const note = inputData[1];
        assignLaneInput(lane, note.toString());

        setListening(false);
        listeningRef.current = false; 
        
        buttonRef.current?.blur(); 
    }

    if(midiAccess) {
        const inputs = midiAccess.inputs; 
        inputs.forEach(input => { 
            input.addEventListener('midimessage', processMidiMessage) 
        });
    }


    const handleKeyDown = useRef((event: KeyboardEvent) => {   
        if(event.key == 'space' || event.key == ' ')
            event.preventDefault(); 

        if(!listeningRef.current) 
            return; 

        setListening(false);
        listeningRef.current = false;
        buttonRef.current?.blur(); 

        console.log(event); 

        assignLaneInput(lane, event.key); 
    });

    useEffect(() => {
        // Handler and references used so that event listener 
        // only has to be mounted once, not on ever state chagne
        const keyDownHandler = (event: KeyboardEvent) => handleKeyDown.current(event); 
        window.addEventListener("keydown", keyDownHandler)
        return () => { 
            window.removeEventListener("keydown", keyDownHandler) 
            if(midiAccess) {
                midiAccess.inputs.forEach(input => {
                    input.removeEventListener('midimessage', processMidiMessage);
                });
            }
        }
    }, [])
    

    return (<>
    <div className="change_lane_key">

    <button title="Listen for input key"
        ref={buttonRef}
        onFocus={() => {
            setListening(true);
            listeningRef.current = true; 
        }}
        onBlur={() => {
            if(listeningRef.current) {
              setListening(false);
              listeningRef.current = false; 
              console.log(listening)
            }
          }}  
        >
        { listening ? 'Listening...' : 'Assign Input' }
        {/* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-keyboard"><path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/></svg> */}
    </button>


    </div>
    </> 
    )
}

export default ChangeLaneKey