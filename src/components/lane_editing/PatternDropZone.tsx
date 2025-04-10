import React, { useEffect, useRef, useState } from 'react'
import Lane from '../../scripts/Lane';
import { PatternModeSection } from '../../scripts/types';
import { supabase } from '../../scripts/supa-client';
import { loadFromLocalStorage } from '../../scripts/Utils';
import { retrieveBucketData } from '../../scripts/SupaUtils';

interface IPatternDropZoneProps {
    lane: Lane; 
    setMessage: React.Dispatch<React.SetStateAction<string>>;

    droppedPatterns: PatternModeSection[];
    setDroppedPatterns: React.Dispatch<React.SetStateAction<PatternModeSection[]>>;

    droppedPatternsRef: React.RefObject<PatternModeSection[]>;

    draggedPatternRef: React.RefObject<{name: string, measures: number} | null>;
}

// TODO: Allow for clicking pattern for loading
const PatternDropZone: React.FC<IPatternDropZoneProps> 
= ({ lane, setMessage, setDroppedPatterns, droppedPatternsRef, draggedPatternRef }) => {       
    
    const [startMeasure, setStartMeasure] = useState(0); 
    const patternStartMeasureChange = (e: number) => { setStartMeasure(e); }
    const [pendingPattern, setPendingPattern] = useState<{ pattern: PatternModeSection; data: any } | null>(null);

    useEffect(() => { lane.onPatternStartChange(patternStartMeasureChange); }, []);

    const removePattern = (patternID: string) => {
        setDroppedPatterns(prev => {
            const updated = prev.filter(pattern => pattern.id !== patternID);
            droppedPatternsRef.current = updated; 
            return updated;
        }
        );
    };

    // TODO: Lift this to lane editing panel
    async function loadPattern(occurances: number, patternName: string) {
        let patternData;
        let patternID = crypto.randomUUID(); 

        const userId = (await supabase.auth.getUser()).data.user?.id as string;
        if(userId) {
            // Fetch from Supabase
            patternData = await retrieveBucketData('patterns', `${userId}/${lane.subdivision}/${patternName}`);
        } else {
            // Fetch from local storeage
            patternData = loadFromLocalStorage(`patterns/${patternName}`);
        }

        let pattern = {
            id: patternID, 
            start: lane.patternStartMeasure, 
            occurances: occurances, 
            length: patternData.measures * occurances, 
            name: patternName, 
            data: patternData
        };

        console.log(pattern);

        setDroppedPatterns(prev => {
            const updated = [pattern, ...prev];
            droppedPatternsRef.current = updated; 
            return updated; 
        });

        // Defer actual lane loading
        setPendingPattern({ pattern, data: patternData});
    }

    useEffect(() => {
        if(!pendingPattern) return; 
1
        const { pattern, data } = pendingPattern;
        if(lane.loadPattern(data, pattern.occurances) == -1) {
            setMessage('Lane not long enough')
            setTimeout(() => setMessage(''), 1500); 
            removePattern(pattern.id)
        }  

        setPendingPattern(null);
    }, [pendingPattern]);

    return (
    <div className='pattern_drop_zone' 
    onDragOver={(e) => { 
        if(!draggedPatternRef.current) { return }
        console.log(draggedPatternRef.current)
        if(lane.patternStartMeasure + draggedPatternRef.current.measures <= lane.measureCount) {
            e.preventDefault();
        }
     }}

    onDragEnter={(e) => {
        e.currentTarget.classList.add('draggedOver');
        if(!draggedPatternRef.current) { return }

        if(lane.patternStartMeasure + draggedPatternRef.current.measures > lane.measureCount) {
            setMessage('Lane not long enough');
            e.currentTarget.classList.add('invalid');
        }
    }}

    onDragLeave={(e) => {
        e.currentTarget.classList.remove('draggedOver');
        e.currentTarget.classList.remove('invalid');
        setMessage('');
    }}

    onDrop={(e) => {
        e.currentTarget.classList.remove('invalid');
        e.currentTarget.classList.remove('draggedOver');

        if(!draggedPatternRef.current) { return }
        loadPattern(draggedPatternRef.current.measures, draggedPatternRef.current.name); 

        setTimeout(() => setMessage(''), 1500); 
    }}> 
        <p> Drop pattern here</p>
    </div>
    )
}

export default PatternDropZone