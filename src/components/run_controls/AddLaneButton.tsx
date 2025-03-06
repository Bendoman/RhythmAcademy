import React, { useEffect, useState } from 'react'
import LaneEditingPanel from '../LaneEditingPanel.tsx'
import { onAddLaneButtonClick } from '../../scripts/main.ts'
import { createRoot } from 'react-dom/client';

const AddLaneButton = () => {
  const [listening, setListening] = useState(false);
  const [inputValue, setInputValue] = useState("Input key...");

  const handleKeyDown = (event: KeyboardEvent) => {
    // TODO: Potentially move this higher up
    if(event.key == 'space' || event.key == ' ')
      event.preventDefault(); 

    if(!listening) 
      return; 
    setInputValue(event.key);
    setListening(false);
    console.log(event); 
  }

  const handleOnClick = () => {
    let key = ""; 
    if(inputValue != "Listening..." && inputValue != "Input key..."){ key = inputValue; }
    const laneEditingSection = onAddLaneButtonClick(key);
    console.log(laneEditingSection)

    if(!laneEditingSection)
      return; 

    const root = createRoot(laneEditingSection);
    root.render(<LaneEditingPanel canvas={laneEditingSection.previousSibling as HTMLCanvasElement}/>);
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => { window.removeEventListener("keydown", handleKeyDown) }
  })

  return (<>
        <button
            className='add_lane_button'
            onClick={handleOnClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-plus"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
        </button>

        <input 
          readOnly id="new_lane_input" 
          type="text" 
          value={inputValue == " " ? "space" : inputValue} 
          onFocus={() => {
            setInputValue("Listening...")
            setListening(true);
          }}
          onBlur={() => {
            if(listening) {
              console.log("here");
              setInputValue("Input key...")
              setListening(false);
            }
          }}  
        />
        </>)
}

export default AddLaneButton
