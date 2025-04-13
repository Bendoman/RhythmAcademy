import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import LaneEditingPanel from '../lane_editing/LaneEditingPanel.tsx'
import { lanes, onAddLaneButtonClick, saveCurrentSessionLocally } from '../../scripts/main.ts'
import { createRoot } from 'react-dom/client';
import ChangeLaneKey from './ChangeLaneKey.tsx';
import { midiAccess } from '../Homepage';
import { useAppContext } from '../AppContextProvider.tsx';
import { saveToLocalStorage } from '../../scripts/Utils.ts';


const AddLaneButton = forwardRef<HTMLButtonElement>((props, ref) => {
  const [listening, setListening] = useState(false);
  const listeningRef = useRef(false);

  // TODO: Handle this in same way as change lane key
  const [inputValue, setInputValue] = useState("Input key...");
  const inputValueRef = useRef("Input key...");

  const inputElementRef = useRef<HTMLInputElement>(null);

  const processMidiMessage = (input: MIDIMessageEvent) => {    
    if(!listeningRef.current) return; 

    const inputData = input.data; 
    if(inputData == null) return; 

    const note = inputData[1];
    setInputValue(note.toString());
    setListening(false);
    listeningRef.current = false; 
  }; 

  if(midiAccess) {
      const inputs = midiAccess.inputs; 
      inputs.forEach(input => { 
        input.addEventListener('midimessage', processMidiMessage); 
      });
  }

  const handleKeyDown = useRef((event: KeyboardEvent) => {    
    if(!listeningRef.current || event.key == ' ')
      return;

    setInputValue(event.key);
    setListening(false);
    console.log(event); 
  })

  const { setShowLogo, setCurrentSessionAltered, showSessionToolTip, setCurrentSessionName } = useAppContext(); 

  const handleOnClick = () => {
    setCurrentSessionAltered(true); 
    saveToLocalStorage('stats', '');
    
    setCurrentSessionName('');

    let key = ""; 

    if(inputValue != "Listening..." && inputValue != "Input key...")
      key = inputValue; 
    
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

    const laneCanvas = canvasContainer.querySelector('canvas') as HTMLCanvasElement
    
    root.render(<LaneEditingPanel canvas={laneCanvas} setShowLogo={setShowLogo}/>);

    laneContent.classList.add('lane_content');
    contentRoot.render(<ChangeLaneKey canvas={laneCanvas}/>)
    
    canvasContainer.appendChild(laneContent);
    saveCurrentSessionLocally();
    
    setShowLogo(false);
    setShowToolTips(false); 
  }

  useEffect(() => {
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

  const { showToolTips, setShowToolTips } = useAppContext(); 
  const [hovered, setHovered] = useState(false);

  return (<>
    <button
        onMouseEnter={() => {setHovered(true)}}
        onMouseLeave={() => {setHovered(false)}}
        ref={ref}
        id="add_button"
        className='add_lane_button'
        onClick={handleOnClick}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-plus"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>


        { showToolTips &&   
        <div className="tooltip">
          Click here to add your first lane!
          <div className="tooltip-arrow" />
        </div> }

        { showSessionToolTip && hovered && 
        <div className="tooltip">
          Stats for this preset wont count if add a lane
          <div className="tooltip-arrow" />
        </div> }
    </button>
  </>)
});

export default AddLaneButton
