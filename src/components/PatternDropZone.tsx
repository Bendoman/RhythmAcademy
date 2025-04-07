import React, { useEffect, useRef, useState } from 'react'
import Lane from '../scripts/Lane';
import { PatternModeSection } from '../scripts/types';
import { supabase } from '../scripts/supa-client';
import { getEditMode, retrieveBucketData } from '../scripts/main';
import { EDIT_MODES } from '../scripts/constants';

interface IPatternDropZoneProps {
    lane: Lane; 
    setMessage: React.Dispatch<React.SetStateAction<string>>;

    droppedPatterns: PatternModeSection[];
    setDroppedPatterns: React.Dispatch<React.SetStateAction<PatternModeSection[]>>;

    droppedPatternsRef: React.RefObject<PatternModeSection[]>;
}



// TODO: Allow for clicking pattern to drop them herer too
const PatternDropZone: React.FC<IPatternDropZoneProps> 
= ({ lane, setMessage, setDroppedPatterns, droppedPatternsRef }) => {       
    
    const [startMeasure, setStartMeasure] = useState(0); 
    const patternStartMeasureChange = (e: number) => { setStartMeasure(e); }
    useEffect(() => { lane.onPatternStartChange(patternStartMeasureChange); }, []);

    const removePattern = (patternID: string) => {
        setDroppedPatterns(prev => {
            const updated = prev.filter(pattern => pattern.id !== patternID);
            droppedPatternsRef.current = updated; 
            return updated;
        }
        );
    };

    async function loadPattern(occurances: number, patternName: string) {
        // TODO: Allow for local loading. 
        let patternID = crypto.randomUUID(); 

        let pattern = {id: patternID, start: lane.patternStartMeasure, length: occurances, name: patternName, data: null}

        const userId = (await supabase.auth.getUser()).data.user?.id as string;
        let patternData = await retrieveBucketData('patterns', `${userId}/${lane.subdivision}/${patternName}`);
        pattern.data = patternData; 

        setDroppedPatterns(prev => {
            const updated = [pattern, ...prev];
            droppedPatternsRef.current = updated; 
            return updated; 
        });

        // Defer actual lane loading
        setPendingPattern({ pattern, data: patternData});
    }

    const [pendingPattern, setPendingPattern] = useState<{ pattern: PatternModeSection; data: any } | null>(null);
    useEffect(() => {
        if(!pendingPattern) return; 

        const { pattern, data } = pendingPattern;

        if(lane.loadPattern(data, pattern.length) == -1) {
            setMessage('will overflow')
            removePattern(pattern.id)
        }  

        setPendingPattern(null);
    }, [pendingPattern]);


    return (
    <div className='pattern_drop_zone' 
    onDragOver={(e) => {
        e.currentTarget.classList.add('draggedOver');
        const patternData = e.dataTransfer.getData('application/JSON');
        let data = JSON.parse(patternData);
        
        if(lane.patternStartMeasure + data.measures > lane.measureCount) {
            setMessage('will overflow');
            e.currentTarget.classList.add('invalid');
        } else {
            e.preventDefault();
        }
    }}

    onDragLeave={(e) => {
        e.currentTarget.classList.remove('draggedOver');
        e.currentTarget.classList.remove('invalid');
        setMessage('');
    }}

    onDrop={(e) => {
        e.currentTarget.classList.remove('draggedOver');

        const patternData = e.dataTransfer.getData('application/JSON');
        let data = JSON.parse(patternData);
        

        console.debug('dropping')
        loadPattern(data.measures, data.name); 
    }}>
        <p>
            Next pattern from measure ({startMeasure + 1})
        </p>
    </div>
    )
}

export default PatternDropZone