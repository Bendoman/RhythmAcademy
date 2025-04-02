import React, { useState } from 'react'
import Lane from '../scripts/Lane';
import { createRoot } from 'react-dom/client';
import DroppedPattern from './DroppedPattern';

interface IPatternDropZoneProps {
    lane: Lane; 
}

// TODO: Allow for clicking pattern to drop them herer too
const PatternDropZone: React.FC<IPatternDropZoneProps> = ({ lane }) => {
    const [data, setData] = useState(''); 
    
    return (<div className='pattern_drop_zone' 
    onDragOver={(e) => {
        e.preventDefault(); 
    }}

    onDragEnter={(e) => {
        e.currentTarget.classList.add('draggedOver');
    }}

    onDragLeave={(e) => {
        e.currentTarget.classList.remove('draggedOver');
        
    }}

    onDrop={(e) => {
        e.currentTarget.classList.remove('draggedOver');

        console.log(e);
        const patternData = e.dataTransfer.getData('application/JSON');
        let data = JSON.parse(patternData);
        

        const container = e.currentTarget.parentElement; 
        let droppedPattern = document.createElement('div'); 
        droppedPattern.classList.add('dropped_pattern_container');

        let root = createRoot(droppedPattern); 

        root.render(<DroppedPattern lane={lane} name={data.name} measures={data.measures}/>);
        
        // container?.prepend(droppedPattern); 
        container?.insertBefore(droppedPattern, container.childNodes[1]); 
    }}>
        Next pattern
    </div>)
}

export default PatternDropZone