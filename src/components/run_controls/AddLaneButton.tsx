import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import LaneEditingPanel from '../LaneEditingPanel.tsx'
import { onAddLaneButtonClick } from '../../scripts/main.ts'
import { createRoot } from 'react-dom/client';
import ChangeLaneKey from './ChangeLaneKey.tsx';

export interface AddLaneButtonRef {
  processMidiMessage: (input: MIDIMessageEvent) => void; 
}

const AddLaneButton = forwardRef<AddLaneButtonRef, {}>((_, ref) => {
  const [listening, setListening] = useState(false);
  const listeningRef = useRef(false);

  const [inputValue, setInputValue] = useState("Input key...");
  const inputValueRef = useRef("Input key...");

  const inputElementRef = useRef<HTMLInputElement>(null);

  const processMidiMessage = (input: MIDIMessageEvent) => {    
    console.log("From in here");
    if(!listening) return; 

    const inputData = input.data; 
    if(inputData == null) return; 

    const note = inputData[1];
    setInputValue(note.toString());
    setListening(false);
  }; useImperativeHandle(ref, () => ({ processMidiMessage, }));

  const handleKeyDown = useRef((event: KeyboardEvent) => {    
    if(event.key == 'space' || event.key == ' ')
      event.preventDefault(); 

    if(!listeningRef.current) 
      return; 

    setInputValue(event.key);
    setListening(false);
    console.log(event); 
  })

  const handleOnClick = () => {
    let key = ""; 
    console.log(inputValue)
    if(inputValue != "Listening..." && inputValue != "Input key..."){ key = inputValue; }
    // TODO: Refactor this name
    const canvasContainer = onAddLaneButtonClick(key);
  
    if(!canvasContainer)
      return; 
  
    const laneEditingSection = canvasContainer.querySelector(".lane_editing_section")

    if(!laneEditingSection)
      return;

    // TODO: Rename these
    const root = createRoot(laneEditingSection);
    const laneContent = document.createElement('div');
    const contentRoot = createRoot(laneContent);

    const unmount=()=>{console.log("unmounting"); 
      root.unmount(); contentRoot.unmount()
    };
    
    root.render(<LaneEditingPanel unmount={unmount} canvas={canvasContainer.querySelector('canvas') as HTMLCanvasElement}/>);

    // TODO: Refactor name
    laneContent.classList.add('lane_content');
    laneContent.innerText = "testing";
    contentRoot.render(<ChangeLaneKey/>)
  
    canvasContainer.appendChild(laneContent);

  }

  useEffect(() => {
    console.log("updating listening")
    listeningRef.current = listening;

    if(!listening && inputElementRef.current)
      inputElementRef.current.blur();

  }, [listening]);

  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValueRef]);

  useEffect(() => {
    // Handler and references used so that event listener 
    // only has to be mounted once, not on ever state chagne
    const keyDownHandler = (event: KeyboardEvent) => handleKeyDown.current(event); 
    window.addEventListener("keydown", keyDownHandler)
    return () => { window.removeEventListener("keydown", keyDownHandler) }
  }, [])

  return (<>
        <button
            className='add_lane_button'
            onClick={handleOnClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-plus"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
        </button>

        <input 
          ref={inputElementRef}
          readOnly id="new_lane_input" 
          type="text" 
          value={inputValue == " " ? "space" : inputValue} 
          onFocus={() => {
            setInputValue("Listening...")
            setListening(true);
          }}
          onBlur={() => {
            if(listeningRef.current) {
              setInputValue("Input key...")
              setListening(false);
              console.log(listening)
            }
          }}  
        />
        </>)
})

export default AddLaneButton
