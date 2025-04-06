import React, { useEffect, useRef, useState } from 'react'
import Lane from '../scripts/Lane';

interface IndividualNoteSectionProps {
    lane: Lane;
    unmount: () => void; 
    setMessage: React.Dispatch<React.SetStateAction<string>>;
    individualNotesSectionRef: React.RefObject<number[][]>; 
    index: number; 
}

const IndividualNoteSection: React.FC<IndividualNoteSectionProps> = ({ lane, setMessage, unmount, individualNotesSectionRef, index }) => {
    

    let startMeasureRef = useRef(0);
    const [startMeasure, setStartMeasure] = useState(0); 
    const [endMeasure, setEndMeasure] = useState(0); 

    let statsRef = useRef<number[]>([]);

    const patternStartMeasureChange = (e: number) => {
        // console.log('changed to ', e); 
        if(e <= startMeasureRef.current) {
            console.log('pattern is gone');

            let currentIndex = individualNotesSectionRef.current.indexOf(statsRef.current); 
            individualNotesSectionRef.current.splice(currentIndex, 1); 
            unmount(); 
        } 
        console.log(startMeasureRef.current - e);
    }

    const measureChange = (startMeasure: number, measureDifference: number) => {
        console.debug('measureChange from notes', startMeasure, measureDifference);

        if(measureDifference < 0 && startMeasure < startMeasureRef.current) {
            
            startMeasureRef.current = startMeasureRef.current + measureDifference;
            statsRef.current[0] = startMeasureRef.current;

            // individualNotesSectionRef.current[index][0] = startMeasureRef.current;
            

            setStartMeasure(startMeasureRef.current + 1);
            setEndMeasure(startMeasureRef.current + statsRef.current[1]);

            
        } else if(startMeasure < startMeasureRef.current) {
            console.log('in here', startMeasureRef.current)

            startMeasureRef.current += measureDifference;
            statsRef.current[0] = startMeasureRef.current;

            console.log('in here', startMeasureRef.current)
            setStartMeasure(startMeasureRef.current + 1);
            setEndMeasure(startMeasureRef.current + statsRef.current[1]);
        }

        console.debug('measureChange from notes after', statsRef.current);

    }

    const onDeleteClick = () => {
        console.log(`index ${index}`);
        console.log('from delete click', statsRef.current, statsRef.current[1]);
        lane.reducePatternOccuances(startMeasureRef.current, statsRef.current[1], 0); 

        let currentIndex = individualNotesSectionRef.current.indexOf(statsRef.current); 
        individualNotesSectionRef.current.splice(currentIndex, 1); 
        unmount(); 

    }
    
    useEffect(() => {
        lane.onPatternChange(measureChange);
        lane.onPatternStartChange(patternStartMeasureChange); 

        statsRef.current = individualNotesSectionRef.current[index]; 


        startMeasureRef.current = statsRef.current[0]; 
        setStartMeasure(startMeasureRef.current + 1);

        console.log(statsRef.current);

        setEndMeasure(statsRef.current[0] + statsRef.current[1]);

        console.log(individualNotesSectionRef.current);
    }, []);
    
    return (
    <div className="individual_note_section">
        
        <div>IndividualNoteSection</div>
        <div>{`Measures ${startMeasure} - ${endMeasure}`}</div>
        <button onClick={onDeleteClick}>delete</button>

    </div>)
}

export default IndividualNoteSection