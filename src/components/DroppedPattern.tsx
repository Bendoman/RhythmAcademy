import React from 'react'
import Lane from '../scripts/Lane';

interface IDroppedPatternProps {
    lane: Lane;
    name: string; 
    measures: number;
}

const DroppedPattern: React.FC<IDroppedPatternProps> = ({ name, measures }) => {
    return (<div className='dropped_pattern'>
        {name}
        <input type="number" min={1} defaultValue={measures} />
        <button>delete</button>
        
    </div>)
}

export default DroppedPattern