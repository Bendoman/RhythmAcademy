import React, { useEffect, useRef, useState } from 'react'
import { statGraphData, statGraphData2, StatsObject } from '../scripts/types';

import { LineChart, Line, Tooltip, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';

interface IStatsScreenProps {
    setShowStats: React.Dispatch<React.SetStateAction<boolean>>;
    stats: StatsObject[];
}

const StatsScreen: React.FC<IStatsScreenProps> = ({ setShowStats, stats }) => {
    const [selectedTab, setSelectedTab] = useState(-1);

    let notesHitRef = useRef<number>(0); 
    let wrongNotesRef = useRef<number>(0); 
    let totalNotesRef = useRef<number>(0); 
    let notesMissedRef = useRef<number>(0); 
    // let notesPlayedRef = useRef<number>(0);

    const [notesHit, setNotesHit] = useState(0);
    const [totalNotes, setTotalNotes] = useState(0);
    const [wrongNotes, setWrongNotes] = useState(0);
    const [notesMissed, setNotesMissed] = useState(0);
    const [notesPlayed, setNotesPlayed] = useState(0);
    const [previousBestMode, setPreviousBestMode] = useState(false); 
    
    const handleKeyDown = (event: KeyboardEvent) => {
        if(event.key != 'Escape')
            return; 
        setShowStats(false);
    }
    
    // const data = [
    //     {name: 'Page A', uv: 400, pv: 2400, amt: 2400}, 
    //     {name: 'Page B', uv: 300, pv: 2400, amt: 2400}
    // ];


    const [data, setData] = useState<statGraphData[]>(); 
    const [data2, setData2] = useState<statGraphData2[]>(); 
    const [division, setDivision] = useState(0); 

    useEffect(()=>{
        // Rounds to the nearest second
        let maxTime = Math.ceil(stats[0].runTotalTime / 1000) * 1000; 
        let divisions = maxTime/1000; 
        setDivision(divisions); 

        const datafoo = Array.from({ length: divisions }, (_, i) => ({
            interval: `${(i + 1)}s`, // or `${cutoffs[i]}` if you store them
            deviation: 0,
            occurances: 0
        }));

        const datafoo2 = Array.from({ length: divisions }, (_, i) => ({
            interval: `${(i + 1)}s`, // or `${cutoffs[i]}` if you store them
            hitPercentage: 0,
            hitNotes: 0,
            missedNotes: 0,
            wrongNotes: 0
        }));
        
        notesHitRef.current = 0; 
        wrongNotesRef.current = 0;
        totalNotesRef.current = 0; 
        notesMissedRef.current = 0;

        stats.forEach(statObject => {
            totalNotesRef.current = totalNotesRef.current + statObject.totalNotes;
            notesHitRef.current = notesHitRef.current + statObject.notesHit.length;
            wrongNotesRef.current = wrongNotesRef.current + statObject.wrongNotes.length; 
            notesMissedRef.current = notesMissedRef.current + statObject.notesMissed.length;
            
            console.log(datafoo[0].deviation);

            // TODO: Have graph for each lane and graph for total
            statObject.notesHit.forEach(note => {
                const index = Math.floor(note.timeHit / 1000)
                datafoo[index].deviation += note.timeToZone;
                datafoo[index].occurances++;

                datafoo2[index].hitNotes++;
            });

            statObject.wrongNotes.forEach(note => {
                const index = Math.floor(note.timeHit / 1000)
                datafoo[index].deviation += note.timeToZone;
                datafoo[index].occurances++;

                datafoo2[index].wrongNotes++;
            });

            statObject.notesMissed.forEach(note => {
                const index = Math.floor(note.timeHit / 1000)
                datafoo2[index].missedNotes++;
            });

        });

        datafoo.forEach(node => {
            if(node.occurances > 0)
                node.deviation = parseInt((node.deviation / node.occurances).toFixed(2));
        });

        datafoo2.forEach((node, index) => {
            if(index > 0) {
                node.hitNotes += datafoo2[index - 1].hitNotes;
                node.missedNotes += datafoo2[index - 1].missedNotes;
                node.wrongNotes += datafoo2[index - 1].wrongNotes;
            }
            node.hitPercentage = parseInt(((node.hitNotes / (node.missedNotes + node.wrongNotes + node.hitNotes)) * 100).toFixed(2)); 
        });
        console.log(datafoo2); 

        setData(datafoo);
        setData2(datafoo2);
        
        setNotesHit(notesHitRef.current);
        setWrongNotes(wrongNotesRef.current);
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
            let trueLength = 0; 
            stats.forEach(statObject => {
                let hits = statObject.notesHit;
                if(hits.length > 0)
                    trueLength++; 
                average += hits.length > 0 ? hits.reduce((sum, note) => sum + note.timeToZone, 0) / hits.length : 0; 
            });
            
            average = average/trueLength; 
        } else {
            let hits = stats[selectedTab].notesHit;
            if (hits.length === 0) return "N/A";
            average = hits.length > 0 ? hits.reduce((sum, note) => sum + note.timeToZone, 0) / hits.length : 0; 
        }
        
        return average > 0 ? `${Math.abs(average).toFixed(2)}ms early` : `${Math.abs(average).toFixed(2)}ms late`; 
    }

    const getMedianDeviation = () => {
        let allDeviations: number[] = [];
    
        if (selectedTab < 0) {
            stats.forEach(statObject => {
                const deviations = statObject.notesHit.map(note => note.timeToZone);
                allDeviations.push(...deviations);
            });
        } else {
            allDeviations = stats[selectedTab].notesHit.map(note => note.timeToZone);
        }
    
        if (allDeviations.length === 0) return "N/A";
    
        // Sort deviations numerically
        allDeviations.sort((a, b) => a - b);
    
        const middle = Math.floor(allDeviations.length / 2);
    
        let median = 0;
        if (allDeviations.length % 2 === 0) {
            median = (allDeviations[middle - 1] + allDeviations[middle]) / 2;
        } else {
            median = allDeviations[middle];
        }
    
        return median > 0 ? `${Math.abs(median).toFixed(2)}ms early` : `${Math.abs(median).toFixed(2)}ms late`;
    };

    const getMeanAverageDeviation = () => {
        let deviations: number[] = [];
    
        if (selectedTab < 0) {
            stats.forEach(statObject => {
                const hits = statObject.notesHit.map(note => note.timeToZone);
                deviations.push(...hits);
            });
        } else {
            deviations = stats[selectedTab].notesHit.map(note => note.timeToZone);
        }
    
        if (deviations.length === 0) return "N/A";
    
        // First, compute the mean
        const mean = deviations.reduce((sum, val) => sum + val, 0) / deviations.length;
    
        // Then compute the average of absolute deviations from the mean
        const meanAbsoluteDeviation = 
            deviations.reduce((sum, val) => sum + Math.abs(val - mean), 0) / deviations.length;
    
        return `${meanAbsoluteDeviation.toFixed(2)}ms`;
    };

    return (
    <>
    <div className="statsScreen screen">
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

            <div className={`tab ${previousBestMode ? 'selected' : ''}`}
            onClick={()=>{setPreviousBestMode(!previousBestMode)}}>Previous best</div>
        </div>

        <div className="statContentContainer">
            <div className="statContent">
                <div className="stats">
                    {/* TODO: Change the percentages to be relative to notes played not total notes */}
                    <p>Total notes:  {selectedTab < 0 ? totalNotes : stats[selectedTab].totalNotes}</p>
                    <p>Notes played: {selectedTab < 0 ? notesPlayed : stats[selectedTab].notesHit.length + stats[selectedTab].notesMissed.length}</p><br/>

                    <p>Notes hit:    {selectedTab < 0 ? notesHit : stats[selectedTab].notesHit.length}</p>
                    <p>Hit percentage:    {selectedTab < 0 ? ((notesHit/notesPlayed) * 100).toFixed(2) : 
                    ((stats[selectedTab].notesHit.length/
                    (stats[selectedTab].notesMissed.length + stats[selectedTab].notesHit.length))*100).toFixed(2)}
                    %</p><br/>

                    <p>Notes missed: {selectedTab < 0 ? notesMissed : stats[selectedTab].notesMissed.length}</p>
                    <p>Missed percentage: {selectedTab < 0 ? ((notesMissed/notesPlayed) * 100).toFixed(2) : 
                    ((stats[selectedTab].notesMissed.length/(stats[selectedTab].notesMissed.length + stats[selectedTab].notesHit.length))*100).toFixed(2)}
                    %</p><br/>

                    <p>Wrong notes played:  {selectedTab < 0 ? wrongNotes : stats[selectedTab].wrongNotes.length}</p><br/>

                    <p>Hits mean deviation: { getAverageDeviation() }</p>
                    <p>Hits median deviation: {  getMedianDeviation() }</p>
                    <p>Hits mean average deviation: {  getMeanAverageDeviation() }</p>
                </div>

                <div className="graph_container">
                <div className="graph">
                    <LineChart width={division*50} height={300} data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <Line type="monotone" dataKey="deviation" stroke="#8884d8" />
                        <CartesianGrid stroke="#ecdfcc3b" strokeDasharray="5 5" />
                        <XAxis dataKey="interval" />
                        <YAxis tickFormatter={(value) => `${value}ms`}/>
                        <Tooltip />
                    </LineChart>

                    <LineChart width={division*50} height={300} data={data2} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <Line type="monotone" dataKey="hitPercentage" stroke="#8884d8" />
                        <CartesianGrid stroke="#ecdfcc3b" strokeDasharray="5 5" />
                        <XAxis dataKey="interval" />
                        <YAxis tickFormatter={(value) => `${value}%`}/>
                        <Tooltip />
                    </LineChart>
                </div>


                <p>deviation over time</p>
                </div>
            </div>    
        </div>
    </div>


    </>)
}

export default StatsScreen