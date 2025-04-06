import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import Lane from '../scripts/Lane';
import { supabase } from '../scripts/supa-client';
import { retrieveBucketData } from '../scripts/main';

interface IDroppedPatternProps {
    lane: Lane;
    name: string; 
    occurances: number;
    unmount: () => void; 
    setMessage: React.Dispatch<React.SetStateAction<string>>;
    topPatternMeasureRef: React.RefObject<number[][]>; 
}


const DroppedPattern: React.FC<IDroppedPatternProps> = ({ lane, name, occurances, unmount, setMessage, topPatternMeasureRef }) => {
    let startMeasureRef = useRef(0);
    const [startMeasure, setStartMeasure] = useState(0); 

    let patternIndex = useRef(0); 

    let currentOccurances = useRef(occurances);
    const [occuranceState, setOccuranceState] = useState(currentOccurances.current);

    let dataRef = useRef(Object); 

    const patternStartMeasureChange = (e: number) => {
        // console.log('changed to ', e); 
        if(e <= startMeasureRef.current) {
            console.log('pattern is gone');
            topPatternMeasureRef.current.splice(patternIndex.current, 1);
            unmount();
        } 
        console.log(startMeasureRef.current - e);
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

        topPatternMeasureRef.current[patternIndex.current] = [startMeasureRef.current, currentOccurances.current];
    }

    const onDeleteClick = () => {
        lane.reducePatternOccuances(startMeasureRef.current, currentOccurances.current, 0); 
        topPatternMeasureRef.current.splice(patternIndex.current, 1);
        unmount(); 

        // .push([startMeasureRef.current, currentOccurances.current]);
    }

    const onReloadClick = () => {
        console.log(startMeasureRef.current);
        lane.increasePatternOccurances(startMeasureRef.current, currentOccurances.current, currentOccurances.current, dataRef.current)
    }
    
    const onOccuranceInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        let newOccurances = parseInt(e.target.value); 
        let code = 0; 

        if(newOccurances < currentOccurances.current) {
            lane.reducePatternOccuances(startMeasureRef.current, currentOccurances.current, newOccurances);
        } else {
            code = lane.increasePatternOccurances(startMeasureRef.current, currentOccurances.current, newOccurances, dataRef.current);
            console.log(code);
        }

        console.log('code ', code);
        if(code == 0) {
            currentOccurances.current = newOccurances;
            setOccuranceState(currentOccurances.current);

            topPatternMeasureRef.current[patternIndex.current] = [startMeasureRef.current, currentOccurances.current];
        } else 
            e.target.value = currentOccurances.current.toString();
    }
    
    async function loadPattern() {
        // TODO: Allow for local loading. 
        const userId = (await supabase.auth.getUser()).data.user?.id as string;
        let patternData = await retrieveBucketData('patterns', `${userId}/${name}`);
        dataRef.current = patternData; 

        console.log(patternData);
        if(lane.loadPattern(patternData, currentOccurances.current) == -1) {
            setMessage('will overflow')
            unmount();
        } 
        
    }
    
    useEffect(() => {        
        loadPattern(); 
        lane.onPatternStartChange(patternStartMeasureChange);
        lane.onPatternChange(measureChange);
        
        startMeasureRef.current = lane.patternStartMeasure; 
        setStartMeasure(startMeasureRef.current + 1);

        topPatternMeasureRef.current.push([startMeasureRef.current, currentOccurances.current]);
        patternIndex.current = topPatternMeasureRef.current.length - 1; 
        
        return () => {
            console.log('unmounting')
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

        { startMeasureRef.current > 0 && 
        <div className="spacer_container">
            <div className="spacer"></div>
            <div className="spacer"></div>
        </div>
        }
    </div>)
}

export default DroppedPattern