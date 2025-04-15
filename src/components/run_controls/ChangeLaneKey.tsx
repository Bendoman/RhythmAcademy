import React, { useEffect, useRef, useState } from 'react'
import '../styles/lane_content.css';
import Lane from '../../scripts/classes/Lane';
import { assignLaneInput, drawSingleLane, findLaneFromCanvas, lanes, saveCurrentSessionLocally } from '../../scripts/main';
import { midiAccess } from '../Homepage';
import { prohibitedKeysList } from '../../scripts/helpers/utils';

interface IChangeLaneKeyProps {
    canvas: HTMLCanvasElement;
}

const ChangeLaneKey: React.FC<IChangeLaneKeyProps> = ({ canvas }) => {
    const lane: Lane = findLaneFromCanvas(canvas);
    const [index, setIndex] = useState(lanes.indexOf(lane)); 
    const [currentInput, setCurrentInput] = useState(lane.inputKey);
    
    const [listening, setListening] = useState(false);
    const [showInputKeyToolTip, setShowInputKeyToolTip] = useState(true);
    const listeningRef = useRef(false);

    const [showErrorBubble, setShowErrorBubble] = useState(false);
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

    const handleKeyDown = (event: KeyboardEvent) => {   
        if(!listeningRef.current) 
            return; 

        // TODO: Move this to prohibited keys list
        if(prohibitedKeysList.includes(event.key)) {
            event.preventDefault(); 
            return;
        }

        setListening(false);
        listeningRef.current = false;
        buttonRef.current?.blur(); 

        let code = assignLaneInput(lane, event.key); 
        if(code == -1) {
            setShowErrorBubble(true);
            setTimeout(() => setShowErrorBubble(false), 1500); // hide after 1.5s
        }
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        
        return () => { 
            window.removeEventListener("keydown", handleKeyDown) 
            if(midiAccess) {
                midiAccess.inputs.forEach(input => {
                    input.removeEventListener('midimessage', processMidiMessage);
                });
            }
        }
    }, []);
    
    return (<>
    <div className="change_lane_key">

    <button title="Listen for input key"
        ref={buttonRef}
        onFocus={() => {
            setListening(true);
            listeningRef.current = true; 
            setShowInputKeyToolTip(false);
        }}
        onBlur={() => {
            if(listeningRef.current) {
              setListening(false);
              listeningRef.current = false; 
            }
          }}  
        >
        { listening ? 'Listening...' : 'Assign Input' }
        {showErrorBubble && ( <div className="error_popup input_key_error">Key already in use</div> )}

        { showInputKeyToolTip && index == 0 && currentInput == '(?)' &&
        <div className="tooltip lane_edit_tooltip">
          Enter edit mode and click lane<br/>to add notes
          <div className="tooltip-arrow" />
        </div> }

        { showInputKeyToolTip && index == 0 && currentInput == '(?)' &&
        <div className="tooltip input_key_tooltip">
          Set your new lane's input key
          <div className="tooltip-arrow" />
        </div> }
    </button>

    </div>
    </> 
    )
}

export default ChangeLaneKey