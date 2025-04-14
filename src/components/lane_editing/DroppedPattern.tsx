import React, { ChangeEvent, useEffect, useRef, useState } from 'react'

import Lane from '../../scripts/classes/Lane';
import { PatternModeSection } from '../../scripts/types';

interface IDroppedPatternProps {
    lane: Lane;
    pattern: PatternModeSection;
    setMessage: React.Dispatch<React.SetStateAction<string>>;
    droppedPatternsRef: React.RefObject<PatternModeSection[]>;
    setDroppedPatterns: React.Dispatch<React.SetStateAction<PatternModeSection[]>>;  
}

const DroppedPattern: React.FC<IDroppedPatternProps> = ({ lane, setDroppedPatterns, droppedPatternsRef, pattern, setMessage }) => {
    let startMeasureRef = useRef(pattern.start);
    const [startMeasure, setStartMeasure] = useState(startMeasureRef.current + 1); 

    let currentOccurances = useRef(pattern.occurances);
    const [occuranceState, setOccuranceState] = useState(currentOccurances.current);

    const updatePattern = (updatedData: Partial<{ start: number; occurances: number, length: number }>) => {
        setDroppedPatterns(prev => {
            const updated = prev.map(p =>
                p.id === pattern.id ? { ...p, ...updatedData } : p
            )
            droppedPatternsRef.current = updated; 
            return updated;
        });
    }

    const removePattern = () => {
        setDroppedPatterns(prev => {
            const updated = prev.filter(p => p.id !== pattern.id);
            droppedPatternsRef.current = updated; 
            return updated;
        });
    }

    // If lane measure count reduced below start of pattern, it no longer exists
    const patternStartMeasureChange = (e: number) => { 
        if(e < startMeasureRef.current + (pattern.data.measures * currentOccurances.current) 
        || e <= startMeasureRef.current) { 
            removePattern() 
        }
    }

    const measureChange = (startMeasure: number, measureDifference: number) => {        
        if(measureDifference < 0) {
            if(startMeasure < startMeasureRef.current) {
                startMeasureRef.current = startMeasureRef.current + measureDifference;
                setStartMeasure(startMeasureRef.current + 1);
            }
        } else if(startMeasure < startMeasureRef.current) {
            startMeasureRef.current += measureDifference;
            setStartMeasure(startMeasureRef.current + 1);
        }
        updatePattern({start: startMeasureRef.current, length: pattern.data.measures * currentOccurances.current});
        console.debug(pattern.id, startMeasureRef.current, currentOccurances.current, pattern.data.measures * currentOccurances.current);
    }

    const onDeleteClick = () => {
        console.debug(pattern.id, startMeasureRef.current, currentOccurances.current);
        removePattern();
        lane.reducePatternOccuances(startMeasureRef.current, pattern.data.measures, currentOccurances.current, 0); 
    }

    const onReloadClick = () => {
        lane.increasePatternOccurances(startMeasureRef.current, pattern.data.measures, currentOccurances.current, currentOccurances.current, pattern.data)
    }
    
    const onOccuranceInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        let code = 0; 
        let newOccurances = parseInt(e.target.value); 
        if(newOccurances < currentOccurances.current) {
            lane.reducePatternOccuances(startMeasureRef.current, pattern.data.measures, currentOccurances.current, newOccurances);
        } else {
            code = lane.increasePatternOccurances(startMeasureRef.current, pattern.data.measures, currentOccurances.current, newOccurances, pattern.data);
        }
        
        console.debug('code ', code);
        if(code == 0) {            
            currentOccurances.current = newOccurances;
            setOccuranceState(currentOccurances.current);
            updatePattern({start: startMeasureRef.current, occurances: currentOccurances.current, length: (currentOccurances.current * pattern.data.measures)});
        } else {
            e.target.value = currentOccurances.current.toString();
            setMessage('Lane not long enough')
            setTimeout(() => setMessage(''), 1500); 
        }
    }

    useEffect(() => {        
        currentOccurances.current = pattern.occurances;
        setOccuranceState(currentOccurances.current);
        
        lane.onPatternStartChange(patternStartMeasureChange);
        lane.onPatternChange(measureChange);

        return () => {
            lane.removePatternStartChange(patternStartMeasureChange);
            lane.removeOnPatternChange(measureChange);
        }
    }, []);
    
    return (<div className='dropped_pattern'>
        <div className="section_p_container">
            <p>{pattern.name && pattern.name.includes('public_') 
            ? pattern.name.split('/').slice(1).join('/')
            : pattern.name}</p>
        </div>
        
        <div className="section_inner_container">
            <div>{`Measures ${startMeasure} - ${startMeasure + (occuranceState * pattern.data.measures) - 1}`}</div>
            <input className='droppedOccuranceInput' type="number" min={1} defaultValue={pattern.occurances} onChange={onOccuranceInputChange}/>
            <button onClick={onDeleteClick}>delete</button>
            <button onClick={onReloadClick}>reload</button>
        </div>


        { startMeasureRef.current > 0 && 
        <div className="spacer_container">
            <div className="spacer"></div>
            <div className="spacer"></div>
        </div>}
    </div>)
}

export default DroppedPattern
