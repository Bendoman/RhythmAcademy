import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import Lane from '../scripts/Lane';
import { supabase } from '../scripts/supa-client';
import { getEditMode, retrieveBucketData } from '../scripts/main';
import { PatternModeSection } from '../scripts/types';
import { EDIT_MODES } from '../scripts/constants';

interface IDroppedPatternProps {
    lane: Lane;
    name: string; 
    start: number;
    occurances: number;
    // unmount: () => void | null; 
    setMessage: React.Dispatch<React.SetStateAction<string>>;
    // topPatternMeasureRef: React.RefObject<number[][]> | null; 
    setDroppedPatterns: React.Dispatch<React.SetStateAction<PatternModeSection[]>>;
    id: string; 
    data: JSON;

    droppedPatternsRef: React.RefObject<PatternModeSection[]>;
    
}

const DroppedPattern: React.FC<IDroppedPatternProps> = ({ lane, name, start, occurances, setMessage, setDroppedPatterns, id, data, droppedPatternsRef }) => {
    let startMeasureRef = useRef(start);
    const [startMeasure, setStartMeasure] = useState(startMeasureRef.current + 1); 

    let currentOccurances = useRef(occurances);
    const [occuranceState, setOccuranceState] = useState(currentOccurances.current);

    const updatePattern = (updatedData: Partial<{ start: number; length: number }>) => {
        setDroppedPatterns(prev => {
            const updated = prev.map(pattern =>
                pattern.id === id ? { ...pattern, ...updatedData } : pattern
            )
            droppedPatternsRef.current = updated; 
            return updated;
        }
    );};

    const removePattern = () => {
        setDroppedPatterns(prev => {
            const updated = prev.filter(pattern => pattern.id !== id);
            droppedPatternsRef.current = updated; 
            return updated;
        }
        );
    };

    const patternStartMeasureChange = (e: number) => {
        if(e <= startMeasureRef.current) { removePattern(); } 
    }

    const measureChange = (startMeasure: number, measureDifference: number) => {        
        if(measureDifference < 0) {
            if(startMeasure == startMeasureRef.current) {
                currentOccurances.current += measureDifference;
                setOccuranceState(currentOccurances.current);
            } else if(startMeasure < startMeasureRef.current) {
                startMeasureRef.current = startMeasureRef.current + measureDifference;
                setStartMeasure(startMeasureRef.current + 1);
            }
        } else if(startMeasure < startMeasureRef.current) {
            startMeasureRef.current += measureDifference;
            setStartMeasure(startMeasureRef.current + 1);
        }
        updatePattern({start: startMeasureRef.current, length: currentOccurances.current});
        console.debug(id, startMeasureRef.current, currentOccurances.current);
    }

    const onDeleteClick = () => {
        console.debug(id, startMeasureRef.current, currentOccurances.current);
        removePattern();
        lane.reducePatternOccuances(startMeasureRef.current, currentOccurances.current, 0); 
    }

    const onReloadClick = () => {
        lane.increasePatternOccurances(startMeasureRef.current, currentOccurances.current, currentOccurances.current, data)
    }
    
    const onOccuranceInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        let newOccurances = parseInt(e.target.value); 
        let code = 0; 

        // updatePattern({start: startMeasureRef.current, length: newOccurances});
        
        if(newOccurances < currentOccurances.current) {
            lane.reducePatternOccuances(startMeasureRef.current, currentOccurances.current, newOccurances);
        } else {
            code = lane.increasePatternOccurances(startMeasureRef.current, currentOccurances.current, newOccurances, data);
        }
        
        console.debug('code ', code);
        if(code == 0) {            
            currentOccurances.current = newOccurances;
            setOccuranceState(currentOccurances.current);
            updatePattern({start: startMeasureRef.current, length: currentOccurances.current});

        } else {
            e.target.value = currentOccurances.current.toString();
        }
    }

    useEffect(() => {        
        currentOccurances.current = occurances;
        setOccuranceState(currentOccurances.current);


        lane.onPatternStartChange(patternStartMeasureChange);
        lane.onPatternChange(measureChange);

        return () => {
            lane.removePatternStartChange(patternStartMeasureChange);
            lane.removeOnPatternChange(measureChange);
        }
    }, []);
    
    return (<div className='dropped_pattern'>
        {name}
        <input type="number" min={1} defaultValue={occurances} onChange={onOccuranceInputChange}/>
        <button onClick={onDeleteClick}>delete</button>
        <button onClick={onReloadClick}>reload</button>

        <div>{`Measures ${startMeasure} - ${startMeasure + occuranceState - 1}`}</div>
        {/* <div>{`Measures ${startMeasure} - ${startMeasure + occuranceState - 1}`}</div> */}

        { startMeasureRef.current > 0 && 
        <div className="spacer_container">
            <div className="spacer"></div>
            <div className="spacer"></div>
        </div>}
    </div>)
}

export default DroppedPattern