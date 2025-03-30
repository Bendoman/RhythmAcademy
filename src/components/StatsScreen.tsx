import React, { useEffect, useRef, useState } from 'react'
import { StatsObject } from '../scripts/types';


interface IStatsScreenProps {
    setShowStats: React.Dispatch<React.SetStateAction<boolean>>;
    stats: StatsObject[];
}

const StatsScreen: React.FC<IStatsScreenProps> = ({ setShowStats, stats }) => {
    const [selectedTab, setSelectedTab] = useState(-1);

    let notesHitRef = useRef<number>(0); 
    let totalNotesRef = useRef<number>(0); 
    let notesMissedRef = useRef<number>(0); 
    // let notesPlayedRef = useRef<number>(0);

    const [notesHit, setNotesHit] = useState(0);
    const [totalNotes, setTotalNotes] = useState(0);
    const [notesMissed, setNotesMissed] = useState(0);
    const [notesPlayed, setNotesPlayed] = useState(0); 
    
    const handleKeyDown = (event: KeyboardEvent) => {
        if(event.key != 'Escape')
            return; 
        setShowStats(false);
    }

    useEffect(()=>{
        notesHitRef.current = 0; 
        totalNotesRef.current = 0; 
        notesMissedRef.current = 0;

        stats.forEach(statObject => {
            totalNotesRef.current = totalNotesRef.current + statObject.totalNotes;
            notesHitRef.current = notesHitRef.current + statObject.notesHit.length;
            notesMissedRef.current = notesMissedRef.current + statObject.notesMissed.length;
        });
        
        setNotesHit(notesHitRef.current);
        setTotalNotes(totalNotesRef.current);
        setNotesMissed(notesMissedRef.current);
        setNotesPlayed(notesHitRef.current + notesMissedRef.current)

        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); }
    }, []);

    // TODO: Change this from mean to some form of medium
    const getAverageDeviation = () => {
        let average = 0; 
        if(selectedTab < 0) {
            stats.forEach(statObject => {
                let hits = statObject.notesHit;
                average += hits.length > 0 ? hits.reduce((sum, note) => sum + note.timeToZone, 0) / hits.length : 0; 
            });
            average = average/stats.length; 
        } else {
            let hits = stats[selectedTab].notesHit;
            average = hits.length > 0 ? hits.reduce((sum, note) => sum + note.timeToZone, 0) / hits.length : 0; 
        }
        
        return average > 0 ? `${Math.abs(average).toFixed(2)}ms early` : `${Math.abs(average).toFixed(2)}ms late`; 
    }

    return (
    <>
    <div className="statsScreen">
        <div className="closeContainer"
        onClick={()=> { setShowStats(false); }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </div>

        <div className="tabs">
            <div className={`tab ${selectedTab == -1 ? 'selected' : ''}`}
            onClick={()=>{setSelectedTab(-1)}}>All</div>
            {stats.map((statObject, index) => (
                <div key={index} className={`tab ${selectedTab == index ? 'selected' : ''}`}
                onClick={()=>{setSelectedTab(index)}}>
                    {statObject.lane}
                </div>
            ))}
        </div>

        <div className="statContent">
            {/* TODO: Change the percentages to be relative to notes played not total notes */}
            <p>Total notes:  {selectedTab < 0 ? totalNotes : stats[selectedTab].totalNotes}</p>
            <p>Notes played: {selectedTab < 0 ? notesPlayed : stats[selectedTab].notesHit.length + stats[selectedTab].notesMissed.length}</p><br/>

            <p>Notes hit:    {selectedTab < 0 ? notesHit : stats[selectedTab].notesHit.length}</p>
            <p>Hit percentage:    {selectedTab < 0 ? ((notesHit/totalNotes) * 100).toFixed(2) : 
            ((stats[selectedTab].notesHit.length/stats[selectedTab].totalNotes)*100).toFixed(2)}%</p><br/>

            <p>Notes missed: {selectedTab < 0 ? notesMissed : stats[selectedTab].notesMissed.length}</p>
            <p>Missed percentage: {selectedTab < 0 ? ((notesMissed/totalNotes) * 100).toFixed(2) : 
            ((stats[selectedTab].notesMissed.length/stats[selectedTab].totalNotes)*100).toFixed(2)}%</p><br/>

            <p>Hits mean deviation: { getAverageDeviation() }</p>
            <p>Hits median deviation: {  }</p>
            <p>Hits mean average deviation: {  }</p>
        </div>
    </div>

    </>)
}

export default StatsScreen