import React, { useEffect, useRef, useState } from 'react'
import Lane from '../scripts/Lane';
import { PatternModeSection } from '../scripts/types';
import { getEditMode } from '../scripts/main';
import { EDIT_MODES } from '../scripts/constants';

interface IndividualNoteSectionProps {
    id: string; 
    lane: Lane;
    start: number;
    occurances: number;
    setMessage: React.Dispatch<React.SetStateAction<string>>;

    setIndividualNoteSections: React.Dispatch<React.SetStateAction<PatternModeSection[]>>;
    individualNoteSectionsRef: React.RefObject<PatternModeSection[]>;
}

const IndividualNoteSection: React.FC<IndividualNoteSectionProps> = ({ lane, setMessage, start, occurances, id, setIndividualNoteSections, individualNoteSectionsRef}) => {
    let startMeasureRef = useRef(start);
    const [startMeasure, setStartMeasure] = useState(startMeasureRef.current + 1); 

    let currentOccurances = useRef(occurances);
    const [occuranceState, setOccuranceState] = useState(currentOccurances.current);

    const removePattern = () => {
        setIndividualNoteSections(prev => {
            const updated = prev.filter(pattern => pattern.id !== id);
            individualNoteSectionsRef.current = updated; 
            console.debug(updated);
            return updated;
        });
    };

    const updatePattern = (updatedData: Partial<{ start: number; length: number }>) => {
        setIndividualNoteSections(prev => {
            const updated = prev.map(pattern =>
                pattern.id === id ? { ...pattern, ...updatedData } : pattern
            )
            individualNoteSectionsRef.current = updated; 
            return updated;
        }
    );};


    const patternStartMeasureChange = (e: number) => {
        if(e <= startMeasureRef.current) {
            console.log('pattern is gone');
            removePattern();
        } 
    }

    const measureChange = (startMeasure: number, measureDifference: number) => {
        console.log(`measure difference ${measureDifference}`);
        
        if(measureDifference < 0) {
            if(startMeasure == startMeasureRef.current) {
                currentOccurances.current += measureDifference;
                setOccuranceState(currentOccurances.current);
                console.log(currentOccurances);

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
    
    useEffect(() => {
        console.debug(id); 
        lane.onPatternChange(measureChange);
        lane.onPatternStartChange(patternStartMeasureChange); 
    }, []);
    
    return (
    <div className="individual_note_section">
        <div>IndividualNoteSection</div>
        <div>{`Measures ${startMeasure} - ${startMeasure + occuranceState - 1}`}</div>
        <button onClick={onDeleteClick}>delete</button>

        { startMeasureRef.current > 0 && 
        <div className="spacer_container">
            <div className="spacer"></div>
            <div className="spacer"></div>
        </div>}
    </div>)
}

export default IndividualNoteSection