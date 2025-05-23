import Lane from '../../scripts/classes/Lane';
import React, { useEffect, useRef, useState } from 'react'
import LanePatternDisplay from './LanePatternDisplay';

import { supabase } from '../../scripts/helpers/supa-client';
import { EDIT_MODES } from '../../scripts/helpers/constants';
import { retrieveBucketData } from '../../scripts/helpers/supa-utils';
import { changeEditMode, drawSingleLane, setNewPatternMeasures, setPatternInCreation } from '../../scripts/main';

import '../styles/lane_editing.css';
import { loadFromLocalStorage } from '../../scripts/helpers/utils';

interface IPatternEditingPanelProps {
    lane: Lane; 
    patterns: string[]; 
    inPatternMode: boolean; 
    setEditMode: React.Dispatch<React.SetStateAction<string>>;
    setPatternInCreationInputs: React.Dispatch<React.SetStateAction<{patternName: string, measures: number} | null>>;
    activated: boolean; 
}

const PatternEditingPanel: React.FC<IPatternEditingPanelProps> = ({ lane, patterns, inPatternMode, setEditMode, setPatternInCreationInputs, activated }) => {
    let canvas = lane.canvas; 
    // const [visible, setVisible] = useState<boolean>(); 
    let draggedPatternRef = useRef<{name: string, measures: number} | null>(null); 

    async function onEditClick(patternName: string) {
        const userId = (await supabase.auth.getUser()).data.user?.id as string;

        let patternData; 
        if(userId) {
            patternData = await retrieveBucketData('patterns', `${userId}/${lane.subdivision}/${patternName}`);
        } else {
            patternData = loadFromLocalStorage(`patterns/${patternName}`);
        }

        if(!patternData) { return }
        
        setPatternInCreation(patternData.notePositions);

        setEditMode('pattern_creation');
        changeEditMode(EDIT_MODES.CREATE_PATTERN_MODE);
        
        lane.translationAmount = 0;
        drawSingleLane(lane);

        setNewPatternMeasures(patternData.measures);
        setPatternInCreationInputs({patternName: patternName, measures: patternData.measures});
    }

    return (<>
        <LanePatternDisplay lane={lane} visible={inPatternMode && activated} draggedPatternRef={draggedPatternRef}/>

        <div className="patternEditingPanel">
            <p>Saved Patterns {'(drag and drop)'}</p>

            {/* TODO: Preset patterns for each subdivision preloaded for offline */}
            <div className="savedPatternContainer">
                { patterns.map((pattern, index) => {
                    return <div key={index} className='listed_pattern' draggable onDragStart={(e) => {
                        const container = e.currentTarget; 
                        const measureInput = container.querySelector('.patternMeasureCount') as HTMLInputElement; 
                        
                        const patternData = {name: pattern, measures: parseInt(measureInput?.value || '1')}
                        draggedPatternRef.current = patternData;
                    }}>
                        <div className="pattern_name_container">
                            <p>{pattern.includes('public_') 
                            ? pattern.split('/').slice(1).join('/')
                            : pattern}</p>
                        </div>
                        
                        <div className="patternMeasureCountContainer">
                            <input disabled={!activated} type="number" min='1' defaultValue='1' className='patternMeasureCount'/>
                            <p>occurances</p>
                        </div>

                        <button disabled={!activated || pattern.includes('public_')} 
                        className='patternEditButton' onClick={() => {onEditClick(pattern)}}>edit</button>
                    </div>
                })}

                { patterns.length == 0 && <p>No saved patterns</p>}
            </div>
        </div>
    </>)
}

export default PatternEditingPanel