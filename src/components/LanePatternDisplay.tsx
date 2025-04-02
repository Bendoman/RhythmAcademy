import React, { useEffect, useState } from 'react'
import Lane from '../scripts/Lane';
import { createPortal } from 'react-dom';
import PatternDropZone from './PatternDropZone';

interface ILanePatternDisplayProps {
    lane: Lane; 
    visible: boolean;
}

const LanePatternDisplay: React.FC<ILanePatternDisplayProps> = ({ lane,visible }) => {
    const [canvasWidth, setCanvasWidth] = useState(0);

    // let canvas: HTMLCanvasElement;
    let canvas = lane.canvas; 

    useEffect(() => {
        // canvas = lane.canvas
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
              const width = entry.contentRect.width;
              setCanvasWidth(width);
            }
          });
        
          if (canvas) {
            observer.observe(canvas);
          }
        
          return () => {
            console.log('unmoutning')
            observer.disconnect();
          };

          
    }, []);

    if(visible) return createPortal( 
        <div className='lane_pattern_display' style={{ width: `${canvasWidth}px`, height: `${canvas.height - 70}px`, overflowY: 'auto'}}>

            <div className="dropZoneContainer">
                <PatternDropZone lane={lane}/>
            </div>

        </div>,

        canvas.closest('.canvas_container')!
    );
}

export default LanePatternDisplay