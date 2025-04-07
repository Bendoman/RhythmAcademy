import React, { useEffect, useRef, useState } from 'react'
import Lane from '../scripts/Lane';
import { createRoot } from 'react-dom/client';
import DroppedPattern from './DroppedPattern';
import IndividualNoteSection from './IndividualNoteSection';
import { PatternModeSection } from '../scripts/types';
import { supabase } from '../scripts/supa-client';
import { retrieveBucketData } from '../scripts/main';

interface IPatternDropZoneProps {
    lane: Lane; 
    setMessage: React.Dispatch<React.SetStateAction<string>>;

    droppedPatterns: PatternModeSection[];
    setDroppedPatterns: React.Dispatch<React.SetStateAction<PatternModeSection[]>>;

    droppedPatternsRef: React.RefObject<PatternModeSection[]>;
}



// TODO: Allow for clicking pattern to drop them herer too
const PatternDropZone: React.FC<IPatternDropZoneProps> 
= ({ lane, setMessage, droppedPatterns, setDroppedPatterns, droppedPatternsRef }) => {       
    
    let topPatternMeasureRef = useRef<number[][]>([]);
    let individualNotesSectionRef = useRef<number[][]>([]);
    
    const [startMeasure, setStartMeasure] = useState(0); 

    let containerRef = useRef<HTMLDivElement | null>(null); 

    let patternID = crypto.randomUUID(); 

    const updatePattern = (id: string, updatedData: Partial<{ start: number; length: number }>) => {
        setDroppedPatterns(prev => {
            const updated = prev.map(pattern =>
                pattern.id === id ? { ...pattern, ...updatedData } : pattern
            )
            droppedPatternsRef.current = updated; 
            return updated;
        }
    );};


    

    async function loadPattern(occurances: number, patternName: string) {
        // TODO: Allow for local loading. 
        let pattern = {id: patternID, start: lane.patternStartMeasure, length: occurances, name: patternName, data: null}

        const userId = (await supabase.auth.getUser()).data.user?.id as string;
        let patternData = await retrieveBucketData('patterns', `${userId}/${patternName}`);
    
        console.log(patternData);
        pattern.data = patternData; 

        setDroppedPatterns(prev => {
            const updated = [pattern, ...prev];
            droppedPatternsRef.current = updated; 
            return updated; 
        });

        if(lane.loadPattern(patternData, occurances) == -1) {
            setMessage('will overflow')
            // unmount();
        }  
    }

    const patternStartMeasureChange = (e: number) => {
        setTimeout(() => {
            // console.log('changed to ', e); 
            setStartMeasure(e);         
            // console.log(topPatternMeasureRef.current[topPatternMeasureRef.current.length - 1])

            let topPattern = topPatternMeasureRef.current[topPatternMeasureRef.current.length - 1];
            // console.debug(topPatternMeasureRef.current);

            for(let i = 0; i < topPatternMeasureRef.current.length; i++) {
                let pattern = topPatternMeasureRef.current[i];

                // console.debug(pattern);
                if(i == 0 && pattern[0] != 0) {
                    console.log('there be notes before first pattern'); 
                    console.log()

                    let sectionInfo = [0, pattern[0]]

                    let alreadyExists = individualNotesSectionRef.current.some((arr) => {
                        if(arr[0] < pattern[0]) return true; 
                        return arr[0] === sectionInfo[0] && arr[1] === sectionInfo[1];
                    });

                    if (!alreadyExists) {
                        individualNotesSectionRef.current.push(sectionInfo);

                        
                        let index = individualNotesSectionRef.current.length - 1; 

                        
                        let individualSection = document.createElement('div'); 
                        individualSection.classList.add('indivudal_section_container');
        
                        let root = createRoot(individualSection);
        
                        const unmount = () => {
                            root.unmount();
                            individualSection?.remove(); 
                        }
        
                        // root.render(<IndividualNoteSection lane={lane} unmount={unmount} individualNotesSectionRef={individualNotesSectionRef} index={index} setMessage={setMessage} />)
                        
                        // containerRef.current?.appendChild(individualSection);
                        // console.debug('pushing individual notes bit ', sectionInfo);

                    }
                    console.log(individualNotesSectionRef.current);
                    // container?.insertBefore(droppedPattern, container.childNodes[1]); 
                }
            }

            if(topPattern != undefined && topPattern[0] + topPattern[1] < e) {
                console.log('there be individual notes above top pattern')

                let sectionInfo = [topPattern[0] + topPattern[1], e - (topPattern[0] + topPattern[1])];
                console.log(sectionInfo);
                let alreadyExists = individualNotesSectionRef.current.some(
                    (arr) => arr[0] === sectionInfo[0]
                );
                
                if (!alreadyExists) {
                    individualNotesSectionRef.current.push(sectionInfo);
                    let index = individualNotesSectionRef.current.length - 1; 

                        
                    let individualSection = document.createElement('div'); 
                    individualSection.classList.add('indivudal_section_container');
    
                    let root = createRoot(individualSection);
    
                    const unmount = () => {
                        root.unmount();
                        individualSection?.remove(); 
                    }
    
                    // root.render(<IndividualNoteSection lane={lane} unmount={unmount} individualNotesSectionRef={individualNotesSectionRef} index={index} setMessage={setMessage} />)
                    
                    // containerRef.current?.insertBefore(individualSection, containerRef.current?.childNodes[1]); 
                    // console.debug('pushing individual notes bit ', sectionInfo);

                }
            }   
        }, 1);
    }

    useEffect(() => {
        topPatternMeasureRef.current = []; 
        lane.onPatternStartChange(patternStartMeasureChange);
    }, []);



    return (
    <div className='pattern_drop_zone' 
    onDragOver={(e) => {
        e.preventDefault(); 
        // setMessage('');
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
        
        if(lane.patternStartMeasure + data.measures > lane.measureCount) {
            setMessage('will overflow');
            return; 
        }


        const container = e.currentTarget.parentElement as HTMLDivElement; 
        containerRef.current = container; 

        let droppedPattern = document.createElement('div'); 
        droppedPattern.classList.add('dropped_pattern_container');

        let root = createRoot(droppedPattern); 

        const unmount = () => {
            root.unmount();
            droppedPattern?.remove(); 
        }

        // root.render(<DroppedPattern 
        //     lane={lane} name={data.name} occurances={data.measures} 
        //     unmount={unmount} setMessage={setMessage} topPatternMeasureRef={topPatternMeasureRef}/>);
        

        loadPattern(data.measures, data.name); 



        // updatePattern(patternID, {start: 100, length: 100});
        // container?.prepend(droppedPattern); 

        // container?.insertBefore(droppedPattern, container.childNodes[1]); 

        


    }}>
        <p>
            Next pattern from measure ({startMeasure + 1})
        </p>
    </div>
    )
}

export default PatternDropZone