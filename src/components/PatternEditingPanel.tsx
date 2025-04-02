import React, { useEffect, useState } from 'react'
import Lane from '../scripts/Lane';
import LanePatternDisplay from './LanePatternDisplay';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';

interface IPatternEditingPanelProps {
    lane: Lane; 
    patterns: string[]; 
    visible: boolean; 
}

const PatternEditingPanel: React.FC<IPatternEditingPanelProps> = ({ lane, patterns, visible }) => {
    let canvas = lane.canvas; 
    let laneContentContainer: HTMLDivElement; 
    let lanePatternContainer: HTMLDivElement;

    const [visibleHere, setVisible] = useState<boolean>(); 

    useEffect(() => {
        canvas = lane.canvas;
        // canvas = lane.canvas
        let laneEditing = canvas.closest('.canvas_container')?.querySelector('.lane_editing')
        setVisible(laneEditing?.classList.contains('activated')!);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // Watches for class attribute mutations
                if(mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    setVisible(laneEditing?.classList.contains('activated')!);  
                }
            })      
        });

        observer.observe(laneEditing!, {
            attributes: true, 
            attributeFilter: ['class'],
        }); 
        
          return () => { observer.disconnect(); };
    }, []);   


    return (<>
        <LanePatternDisplay lane={lane} visible={visible! && visibleHere!}/>

        <div className="patternEditingPanel">
            <div>PatternEditingPanel</div>

            <div className="savedPatternContainer">
                { patterns.map((pattern, index) => {
                    return <div key={index} className='listed_pattern' draggable onDragStart={(e) => {
                        const container = e.currentTarget; 
                        const measureInput = container.querySelector('.patternMeasureCount') as HTMLInputElement; 
                        
                        
                        const patternData = {name: pattern, measures: parseInt(measureInput?.value || '1')}
                        
                        e.dataTransfer.setData("application/JSON", JSON.stringify(patternData));

                    }}>
                        {/* TODO: put in p tag with max width and overflow */}
                        {pattern}
                        <div className="patternMeasureCountContainer">
                            <input type="number" min='1' defaultValue='1' className='patternMeasureCount'/>
                        </div>
                        <button className='patternEditButton' onClick={() => {}}>edit</button>
                    </div>
                })}
            </div>

        </div>
    </>)
}

export default PatternEditingPanel