import '../styles/lane_editing.css'
import Lane from '../../scripts/Lane';
import { PatternModeSection } from '../../scripts/types';
import React, { useEffect, useRef, useState } from 'react';

interface IndividualNoteSectionProps {
    lane: Lane;
    pattern: PatternModeSection;
    setMessage: React.Dispatch<React.SetStateAction<string>>;
    individualNoteSectionsRef: React.RefObject<PatternModeSection[]>;
    setIndividualNoteSections: React.Dispatch<React.SetStateAction<PatternModeSection[]>>;
}

const IndividualNoteSection: React.FC<IndividualNoteSectionProps> = ({ lane, pattern, setIndividualNoteSections, individualNoteSectionsRef}) => {
    let startMeasureRef = useRef(pattern.start);
    let currentOccurances = useRef(pattern.occurances);

    const [startMeasure, setStartMeasure] = useState(startMeasureRef.current + 1); 

    const removePattern = () => {
        setIndividualNoteSections(prev => {
            const updated = prev.filter(p => p.id !== pattern.id);
            individualNoteSectionsRef.current = updated; 
            return updated;
        });
    };

    const updatePattern = (updatedData: Partial<{ start: number; occurances: number, length: number }>) => {
        setIndividualNoteSections(prev => {
            const updated = prev.map(p =>
                p.id === pattern.id ? { ...p, ...updatedData } : p
            )
            individualNoteSectionsRef.current = updated; 
            return updated;
        }
    );};

    // If lane measure count reduced below start of pattern, it no longer exists
    const patternStartMeasureChange = (e: number) => { if(e <= startMeasureRef.current) { removePattern() }}

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

        updatePattern({start: startMeasureRef.current, occurances: currentOccurances.current, length: pattern.length});
    }

    const onDeleteClick = () => {
        removePattern();
        lane.reducePatternOccuances(startMeasureRef.current, pattern.length, currentOccurances.current, 0); 
    }
    
    useEffect(() => {
        console.debug(pattern.id); 
        lane.onPatternChange(measureChange);
        lane.onPatternStartChange(patternStartMeasureChange); 
    }, []);
    
    return (
    <div className="individual_note_section">
        <div className="section_p_container">
            <p>Individually placed notes</p>
        </div>
        <div className="section_inner_container">
            <div>{`Measures ${startMeasure} - ${startMeasure + pattern.length - 1}`}</div>
            <button onClick={onDeleteClick}>delete</button>
        </div>

        { startMeasureRef.current > 0 && 
        <div className="spacer_container">
            <div className="spacer"></div>
            <div className="spacer"></div>
        </div>}
    </div>)
}

export default IndividualNoteSection
