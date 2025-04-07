import React, { useEffect, useRef, useState } from 'react'
import Lane from '../scripts/Lane';
import { createPortal } from 'react-dom';
import PatternDropZone from './PatternDropZone';
import IndividualNoteSection from './IndividualNoteSection';
import { PatternModeSection } from '../scripts/types';
import DroppedPattern from './DroppedPattern';

interface ILanePatternDisplayProps {
    lane: Lane; 
    visible: boolean;
}


const LanePatternDisplay: React.FC<ILanePatternDisplayProps> = ({ lane, visible }) => {
    const updatePattern = (updatedData: Partial<{ start: number; length: number }>, id: string) => {
        setIndividualNoteSections(prev => {
            const updated = prev.map(pattern =>
                pattern.id === id ? { ...pattern, ...updatedData } : pattern
            )
            individualNoteSectionsRef.current = updated; 
            return updated;
        }
    );};

    const [canvasWidth, setCanvasWidth] = useState(0);
    const [message, setMessage] = useState('');

    const [droppedPatterns, setDroppedPatterns] = useState<PatternModeSection[]>([]);
    let droppedPatternsRef = useRef<PatternModeSection[]>([]);

    const [individualNoteSections, setIndividualNoteSections] = useState<PatternModeSection[]>([]);
    let individualNoteSectionsRef = useRef<PatternModeSection[]>([]);

    const patternStartMeasureChange = (e: number) => {      
      setTimeout(() => {
        if(droppedPatternsRef.current.length > 0) {
          // Patterns are poulated
          // console.debug(droppedPatternsRef.current[0]);
          let topPattern = droppedPatternsRef.current[0];
          console.debug(topPattern);
          if(lane.patternStartMeasure > topPattern.start + topPattern.length) {
            // Individually placed notes exist above the top pattern
            let patternID = crypto.randomUUID(); 
            let pattern = {
              id: patternID,
              start: topPattern.start + topPattern.length,
              length: e - (topPattern.start + topPattern.length)
            }
            // console.debug(pattern);
  
            if(individualNoteSectionsRef.current.length > 0) {
              let top = individualNoteSectionsRef.current[0];
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
            length: lane.patternStartMeasure, 
          }
          
          if(individualNoteSectionsRef.current.length > 0) {
            let id = individualNoteSectionsRef.current[0].id;
            updatePattern(pattern, id);
          } else {
            setIndividualNoteSections(prev => {
              const updated = [pattern, ...prev];
              individualNoteSectionsRef.current = updated; 
              return updated; 
            });
          }
        }
      }, 0)
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
                setDroppedPatterns={setDroppedPatterns}
                droppedPatternsRef={droppedPatternsRef}
                />


            {[...individualNoteSections, ...droppedPatterns]
              .sort((a, b) => b.start - a.start)
              .map((pattern, i) => {
                if(pattern.name != undefined) {
                  return (
                    <DroppedPattern
                      key={pattern.id}
                      lane={lane}
                      name={pattern.name!}
                      start={pattern.start}
                      occurances={pattern.length}
                      setMessage={setMessage}
                      setDroppedPatterns={setDroppedPatterns}
                      id={pattern.id}
                      data={pattern.data!}
                      droppedPatternsRef={droppedPatternsRef}
                    />)
                } else {
                  return (
                  <IndividualNoteSection
                    key={pattern.id}
                    lane={lane}
                    setMessage={setMessage}
                    start={pattern.start}
                    occurances={pattern.length}
                    id={pattern.id}
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