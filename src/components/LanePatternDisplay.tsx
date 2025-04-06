import React, { useEffect, useState } from 'react'
import Lane from '../scripts/Lane';
import { createPortal } from 'react-dom';
import PatternDropZone from './PatternDropZone';
import IndividualNoteSection from './IndividualNoteSection';

interface ILanePatternDisplayProps {
    lane: Lane; 
    visible: boolean;
}

const LanePatternDisplay: React.FC<ILanePatternDisplayProps> = ({ lane, visible }) => {

    const onPatternStartMeasureChange = (e: number) => {

    }
  
    const [canvasWidth, setCanvasWidth] = useState(0);
    const [message, setMessage] = useState('');

    let canvas = lane.canvas; 
    useEffect(() => {
        lane.onPatternStartChange(onPatternStartMeasureChange);
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
              const width = entry.contentRect.width;
              setCanvasWidth(width);
            }
          });
        
          if (canvas) { observer.observe(canvas); }
          return () => { observer.disconnect(); };
    }, []);

    return createPortal( 
        <div 
        className={`lane_pattern_display ${visible ? 'visible' : ''}`} 
        style={{ width: `${canvasWidth}px`, height: `${canvas.height - 70}px`, overflowY: 'auto'}}>

            <div className="dropZoneContainer">
                { message && message }
                <PatternDropZone lane={lane} setMessage={setMessage}/>


                
            </div>

        </div>,
        canvas.closest('.canvas_container')!
    );
}
export default LanePatternDisplay