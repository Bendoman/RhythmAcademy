import { createPortal } from 'react-dom';
import React, { useEffect, useRef, useState } from 'react'

import Lane from '../../scripts/classes/Lane';
import DroppedPattern from './DroppedPattern';
import PatternDropZone from './PatternDropZone';

import { PatternModeSection } from '../../scripts/types';
import IndividualNoteSection from './IndividualNoteSection';
import { saveCurrentSessionLocally } from '../../scripts/main';

interface ILanePatternDisplayProps {
    lane: Lane; 
    visible: boolean;
    draggedPatternRef: React.RefObject<{name: string, measures: number} | null>;
}

const LanePatternDisplay: React.FC<ILanePatternDisplayProps> = ({ lane, visible, draggedPatternRef }) => {
    const [message, setMessage] = useState('');
    const [canvasWidth, setCanvasWidth] = useState(0);

    let droppedPatternsRef = useRef<PatternModeSection[]>([]);
    const [droppedPatterns, setDroppedPatterns] = useState<PatternModeSection[]>([]);

    let individualNoteSectionsRef = useRef<PatternModeSection[]>([]);
    const [individualNoteSections, setIndividualNoteSections] = useState<PatternModeSection[]>([]);

    const updatePattern = (updatedData: Partial<{ start: number; length: number }>, id: string) => {
      setIndividualNoteSections(prev => {
          const updated = prev.map(pattern =>
              pattern.id === id ? { ...pattern, ...updatedData } : pattern
          )
          individualNoteSectionsRef.current = updated; 
          return updated;
      }
    )};

    const patternStartMeasureChange = (e: number) => {      
      // TODO: Test if this timeout is necessary
      setTimeout(() => {
      saveCurrentSessionLocally(); 
      if(droppedPatternsRef.current.length > 0) {
        // Patterns are present
        let topPattern = droppedPatternsRef.current[0];
        if(lane.patternStartMeasure > topPattern.start + topPattern.length) {
          // Individually placed notes exist above the top pattern
          let patternID = crypto.randomUUID(); 
          let pattern = {
            id: patternID,
            start: topPattern.start + topPattern.length,
            occurances: 1,
            length: e - (topPattern.start + topPattern.length)
          };
          if(individualNoteSectionsRef.current.length > 0) {
            let top = individualNoteSectionsRef.current[0];
            console.debug(top, topPattern);
            if(top.start == pattern.start) {
              updatePattern(pattern, top.id);
            } else {
              setIndividualNoteSections(prev => {
                const updated = [pattern, ...prev];
                individualNoteSectionsRef.current = updated; 
                return updated; 
              });
            }
          } else {
            setIndividualNoteSections(prev => {
              const updated = [pattern, ...prev];
              individualNoteSectionsRef.current = updated; 
              return updated; 
            });
          }
        }
      } else if(lane.patternStartMeasure > 0) {
        // No patterns exist and notes are already present
        let patternID = crypto.randomUUID(); 
        let pattern = {
          id: patternID, 
          start: 0, 
          occurances: 1,
          length: lane.patternStartMeasure, 
        };

        setIndividualNoteSections(() => {
          const updated = [pattern];
          individualNoteSectionsRef.current = updated; 
          return updated; 
        });
      }}, 0);
    }

    let canvas = lane.canvas; 
    useEffect(() => {
        lane.onPatternStartChange(patternStartMeasureChange);
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
              const width = entry.contentRect.width;
              setCanvasWidth(width);
            }
          });

          if(lane.patternStartMeasure > 0) {
            // No patterns exist and notes are already present
            let patternID = crypto.randomUUID(); 
            let pattern = {
              id: patternID, 
              start: 0, 
              occurances: 1,
              length: lane.patternStartMeasure, 
            }
  
            setIndividualNoteSections(() => {
              const updated = [pattern];
              individualNoteSectionsRef.current = updated; 
              return updated; 
            });
          }
        
          if (canvas) { observer.observe(canvas); }
          return () => { observer.disconnect(); };
    }, []);

    return createPortal( 
        <div 
        className={`lane_pattern_display ${visible ? 'visible' : ''}`} 
        style={{ width: `${canvasWidth}px`, height: `${canvas.height - 70}px`, overflowY: 'auto'}}>
          <div className="dropZoneContainer">
            { message && message }
            <PatternDropZone lane={lane} setMessage={setMessage}
            droppedPatterns={droppedPatterns}
            draggedPatternRef={draggedPatternRef}
            setDroppedPatterns={setDroppedPatterns}
            droppedPatternsRef={droppedPatternsRef}/>

            {[...individualNoteSections, ...droppedPatterns]
              .sort((a, b) => b.start - a.start)
              .map((pattern, i) => {
                if(pattern.name != undefined) {
                  return (
                    <DroppedPattern
                      lane={lane}
                      key={pattern.id}
                      pattern={pattern}
                      setMessage={setMessage}
                      setDroppedPatterns={setDroppedPatterns}
                      droppedPatternsRef={droppedPatternsRef}
                    />)
                } else {
                  return (
                  <IndividualNoteSection
                    lane={lane}
                    key={pattern.id}
                    pattern={pattern}
                    setMessage={setMessage}
                    setIndividualNoteSections={setIndividualNoteSections}
                    individualNoteSectionsRef={individualNoteSectionsRef}
                  />)
                }
              }
            )}
          </div>
        </div>,
        canvas.closest('.canvas_container')!
    );
}
export default LanePatternDisplay