import React, { useEffect, useRef, useState } from 'react'
import { DeviationGraphData, HitPercentageGraphData, StatsObject } from '../scripts/types';

import { LineChart, Line, Tooltip, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { useAppContext } from './AppContextProvider';
import { newRetrieveBucketData, newRetrieveBucketList, newUploadToBucket } from '../scripts/SupaUtils';
import { supabase } from '../scripts/supa-client';
import { loadFromLocalStorage, saveToLocalStorage } from '../scripts/Utils';

const StatsScreen = () => {
    const { setShowStats, stats, currentSessionName, currentSessionAltered, setCurrentSessionAltered } = useAppContext(); 
    const [selectedTab, setSelectedTab] = useState(-1);

    let notesHitRef = useRef<number>(0); 
    let wrongNotesRef = useRef<number>(0); 
    let totalNotesRef = useRef<number>(0); 
    let notesMissedRef = useRef<number>(0); 
    let totalHitPercentageRef = useRef<number>(0); 
    let notesPlayedRef = useRef<number>(0); 
    // let notesPlayedRef = useRef<number>(0);

    const [notesHit, setNotesHit] = useState(0);
    const [totalNotes, setTotalNotes] = useState(0);
    const [wrongNotes, setWrongNotes] = useState(0);
    const [notesMissed, setNotesMissed] = useState(0);
    const [notesPlayed, setNotesPlayed] = useState(0);
    const [personalBest, setPersonalBest] = useState(false);
    const [previousBestMode, setPreviousBestMode] = useState(false); 
    
    const handleKeyDown = (event: KeyboardEvent) => {
        if(event.key != 'Escape')
            return; 
        setShowStats(false);
    }
    
    let divisionRef = useRef(0);



    const [data, setData] = useState<DeviationGraphData[] | HitPercentageGraphData[]>(); 


    let previousBestStatsRef = useRef<StatsObject[]>([]);
    const [previousBestStats, setPreviousBestStatsRef] = useState<StatsObject[]>([]);

    const [currentStats, setCurrentStats] = useState<StatsObject[]>(stats);

    async function saveStats() {
        // TODO: Safeguard against non authenticated requests everywhere
        if(!currentSessionAltered && currentSessionName) {
            console.log('check stats for', currentSessionName);

            const userId = (await supabase.auth.getUser()).data.user?.id as string;
            
            let content = {
                statsObjectArray: stats, 
                totalHitPercentage: totalHitPercentageRef.current
            }

            const data = await newRetrieveBucketData('stats', `${userId}/${currentSessionName}`);
            if(!data) {
                if(notesPlayedRef.current == totalNotesRef.current) {
                    setPersonalBest(true);
                    console.log('must upload new');
                    newUploadToBucket('stats', `${userId}/${currentSessionName}`, currentSessionName, JSON.stringify(content)); 
                }
            } else {
                console.log('must compare');
                const data = await newRetrieveBucketData('stats', `${userId}/${currentSessionName}`);
                console.log(data);      
                if(data.totalHitPercentage! < content.totalHitPercentage && notesPlayedRef.current == totalNotesRef.current) {
                    console.log('new pb, uploading')
                    setPersonalBest(true);
                    newUploadToBucket('stats', `${userId}/${currentSessionName}`, currentSessionName, JSON.stringify(content)); 
                } else {
                    previousBestStatsRef.current = data.statsObjectArray;
                    setPreviousBestStatsRef(previousBestStatsRef.current);
                    console.log('setting previous best', data);
                }
            }
            // console.log(newRetrieveBucketData('stats', currentSessionName));
        } else if(!currentSessionAltered) {
            // Local storage
            let content = {
                statsObjectArray: stats, 
                totalHitPercentage: totalHitPercentageRef.current
            }

            const previousStats = loadFromLocalStorage('stats'); 
            console.log(previousStats);
            if(!previousStats) {
                if(notesPlayedRef.current == totalNotesRef.current) {
                    console.log('must upload new');
                    setPersonalBest(true);

                    saveToLocalStorage('stats', JSON.stringify(content));
                }
            } else {
                console.log('must compare');
                console.log(previousStats);
                if(previousStats.totalHitPercentage! < content.totalHitPercentage && notesPlayedRef.current == totalNotesRef.current) {
                    setPersonalBest(true);
                    console.log('new pb, uploading')
                    saveToLocalStorage('stats', JSON.stringify(content));
                } else {
                    previousBestStatsRef.current = previousStats.statsObjectArray;
                    console.log('setting previous best', previousStats);
                    setPreviousBestStatsRef(previousBestStatsRef.current);
                }
            }
        }
    }



    function populateStats(statsArray: StatsObject[]) {
        // Rounds to the nearest second
        let maxTime = Math.ceil(statsArray[0].runTotalTime / 1000) * 1000; 
        let divisions = maxTime/1000; 
        divisionRef.current = divisions;

        console.log(divisionRef.current);
        

        notesHitRef.current = 0; 
        wrongNotesRef.current = 0;
        totalNotesRef.current = 0; 
        notesMissedRef.current = 0;

        statsArray.forEach(statObject => {
            totalNotesRef.current = totalNotesRef.current + statObject.totalNotes;
            notesHitRef.current = notesHitRef.current + statObject.notesHit.length;
            wrongNotesRef.current = wrongNotesRef.current + statObject.wrongNotes.length; 
            notesMissedRef.current = notesMissedRef.current + statObject.notesMissed.length;
        });

        setNotesHit(notesHitRef.current);
        setWrongNotes(wrongNotesRef.current);
        setTotalNotes(totalNotesRef.current);
        setNotesMissed(notesMissedRef.current);
        setNotesPlayed(notesHitRef.current + notesMissedRef.current)
        notesPlayedRef.current = notesHitRef.current + notesMissedRef.current;

        totalHitPercentageRef.current = parseInt(((notesHitRef.current/(notesHitRef.current + notesMissedRef.current)) * 100).toFixed(2))
    }

    useEffect(() => {
        populateStats(currentStats); 
    }, [currentStats])

    useEffect(()=>{
        window.addEventListener('keydown', handleKeyDown);
        populateStats(currentStats); 
        saveStats(); 
        console.log(previousBestStatsRef.current);

        return () => { 
            window.removeEventListener('keydown', handleKeyDown); 
            setCurrentSessionAltered(false); 
        }

    }, []);

    // TODO: Change this from mean to some form of medium
    const getAverageDeviation = (statsArray: StatsObject[]) => {
        let average = 0; 
        if(selectedTab < 0) {
            let trueLength = 0; 
            statsArray.forEach(statObject => {
                let hits = statObject.notesHit;
                if(hits.length > 0)
                    trueLength++; 
                average += hits.length > 0 ? hits.reduce((sum, note) => sum + note.timeToZone, 0) / hits.length : 0; 
            });
            
            average = average/trueLength; 
        } else {
            let hits = statsArray[selectedTab].notesHit;
            if (hits.length === 0) return "N/A";
            average = hits.length > 0 ? hits.reduce((sum, note) => sum + note.timeToZone, 0) / hits.length : 0; 
        }
        
        return average > 0 ? `${Math.abs(average).toFixed(0)}ms early` : `${Math.abs(average).toFixed(0)}ms late`; 
    }

    const getMedianDeviation = (statsArray: StatsObject[]) => {
        let allDeviations: number[] = [];
    
        if (selectedTab < 0) {
            statsArray.forEach(statObject => {
                const deviations = statObject.notesHit.map(note => note.timeToZone);
                allDeviations.push(...deviations);
            });
        } else {
            allDeviations = statsArray[selectedTab].notesHit.map(note => note.timeToZone);
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
        return median > 0 ? `${Math.abs(median).toFixed(0)}ms early` : `${Math.abs(median).toFixed(0)}ms late`;
    };

    const getRoundedModeDeviation = (statsArray: StatsObject[]) => {
        let deviations: number[] = [];
    
        if (selectedTab < 0) {
            statsArray.forEach(statObject => {
                deviations.push(...statObject.notesHit.map(note => note.timeToZone));
            });
        } else {
            deviations = statsArray[selectedTab].notesHit.map(note => note.timeToZone);
        }
    
        if (deviations.length === 0) return "N/A";
    
        // Round to nearest ms and build frequency map
        const frequencyMap: Record<string, number> = {};
        deviations.forEach(dev => {
            const rounded = Math.round(dev).toString(); // or: dev.toFixed(0)
            frequencyMap[rounded] = (frequencyMap[rounded] || 0) + 1;
        });
    
        // Find mode
        let mode = null;
        let maxCount = 0;
        for (const [value, count] of Object.entries(frequencyMap)) {
            if (count > maxCount) {
                maxCount = count;
                mode = Number(value);
            }
        }
    
        return mode !== null
            ? `${Math.abs(mode).toFixed(0)}ms ${mode > 0 ? 'early' : 'late'}`
            : "N/A";
    };
    

    const [currentChart, setCurrentChart] = useState(0);
    let chartNames = [
        'Deviation over time',
        'Hit percentage over time',
        'Hits and Misses over time'
    ]

    const getChart = (statsArray: StatsObject[]) => {       
        let maxTime = Math.ceil(statsArray[0].runTotalTime / 1000) * 1000; 
        let divisions = maxTime/1000; 

        let deviationGraphData = (Array.from({ length: divisions }, (_, i) => ({
            interval: `${(i + 1)}s`, // or `${cutoffs[i]}` if you store them
            deviation: 0,
            occurances: 0
        })));

        let hitPercentageGraphData = (Array.from({ length: divisions }, (_, i) => ({
            interval: `${(i + 1)}s`, // or `${cutoffs[i]}` if you store them
            hitPercentage: 0,
            hitNotes: 0,
            missedNotes: 0,
            wrongNotes: 0
        })))

        let hitsAndMissesGraphData = (Array.from({ length: divisions }, (_, i) => ({
            interval: `${(i + 1)}s`, // or `${cutoffs[i]}` if you store them
            hitNotes: 0,
            missedNotes: 0,
            wrongNotes: 0
        })))
        

        if(selectedTab == -1) {
            // Create graph combining all lane data
            statsArray.forEach(statObject => {
                statObject.notesHit.forEach(note => {
                    const index = Math.floor(note.timeHit / 1000)
                    console.log(index, deviationGraphData);
                    deviationGraphData[index].deviation += note.timeToZone;
                    deviationGraphData[index].occurances++;
    
                    hitPercentageGraphData[index].hitNotes++;

                    hitsAndMissesGraphData[index].hitNotes++;
                });
    
                statObject.notesMissed.forEach(note => {
                    const index = Math.floor(note.timeHit / 1000)
                    hitPercentageGraphData[index].missedNotes++;
                    hitsAndMissesGraphData[index].missedNotes++;
                });

                    
                statObject.wrongNotes.forEach(note => {
                    const index = Math.floor(note.timeHit / 1000)
                    hitsAndMissesGraphData[index].wrongNotes++;
                });
            });
        } else {
            // Create graph only for selected lane
            statsArray[selectedTab].notesHit.forEach(note => {
                const index = Math.floor(note.timeHit / 1000)
                console.log(index, deviationGraphData);
                deviationGraphData[index].deviation += note.timeToZone;
                deviationGraphData[index].occurances++;

                hitPercentageGraphData[index].hitNotes++;

                hitsAndMissesGraphData[index].hitNotes++;
            });

            statsArray[selectedTab].notesMissed.forEach(note => {
                const index = Math.floor(note.timeHit / 1000)
                hitPercentageGraphData[index].missedNotes++;
                hitsAndMissesGraphData[index].missedNotes++;
            });

            statsArray[selectedTab].wrongNotes.forEach(note => {
                const index = Math.floor(note.timeHit / 1000)
                hitsAndMissesGraphData[index].wrongNotes++;
            });
        }

        console.log(hitsAndMissesGraphData);

        deviationGraphData.forEach(node => {
            if(node.occurances > 0)
                node.deviation = parseInt((node.deviation / node.occurances).toFixed(2));
        });

        hitPercentageGraphData.forEach((node, index) => {
            if(index > 0) {
                node.hitNotes += hitPercentageGraphData[index - 1].hitNotes;
                node.missedNotes += hitPercentageGraphData[index - 1].missedNotes;
                node.wrongNotes += hitPercentageGraphData[index - 1].wrongNotes;
            }
            node.hitPercentage = parseInt(((node.hitNotes / (node.missedNotes + node.hitNotes)) * 100).toFixed(2)); 
        });

        hitsAndMissesGraphData.forEach((node, index) => {
            if(index > 0) {
                node.hitNotes += hitsAndMissesGraphData[index - 1].hitNotes;
                node.missedNotes += hitsAndMissesGraphData[index - 1].missedNotes;
                node.wrongNotes += hitsAndMissesGraphData[index - 1].wrongNotes;
            }
        });

        let data; 
        let unit = ''; 
        let linekey = ''; 
        let axisKey = ''; 

        let secondLine = false; 
        let secondLineKey = '';
        let thirdLineKey = '';
        
        let stroke = '#8884d8';
        let secondStroke = ''
        let thirdStroke = ''

        let legend = false; 

        if(currentChart == 0) {
            data = deviationGraphData; 
            linekey = 'deviation';
            axisKey = 'interval';
            unit = 'ms';
        }
        else if(currentChart == 1) {
            data = hitPercentageGraphData; 
            linekey = 'hitPercentage';
            axisKey = 'interval';
            unit = '%';
        } else if(currentChart == 2) {
            data = hitsAndMissesGraphData; 
            secondLine = true; 
            
            unit = '';
            linekey = 'hitNotes';
            stroke = '#39d641'


            secondLineKey = 'missedNotes'
            secondStroke = '#b83822'


            thirdStroke = '#dfd21f';
            thirdLineKey = 'wrongNotes'

            axisKey = 'interval';

            legend = true; 
        }

        let minWidth = 400;

        return (
            <LineChart width={divisionRef.current*50 > minWidth ? divisionRef.current*50 : minWidth} height={300} data={data} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
            
            <Line type="monotone" dataKey={linekey} stroke={stroke} />
            { secondLine && <Line type="monotone" dataKey={secondLineKey} stroke={secondStroke} /> }
            { secondLine && <Line type="monotone" dataKey={thirdLineKey} stroke={thirdStroke} /> }

            <CartesianGrid stroke="#ecdfcc3b" strokeDasharray="5 5" />
            <XAxis dataKey={axisKey}  />
            <YAxis tickFormatter={(value) => `${value}${unit}`}/>
            <Tooltip />
            </LineChart>
        )
    }

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

            <div 
            className={`tab ${previousBestMode ? 'selected' : ''} ${previousBestStats.length == 0 ? 'disabled' : ''}`}
            onClick={()=>{
                if(previousBestStats.length == 0) 
                    return; 
                setPreviousBestMode(!previousBestMode); 
                setCurrentStats(!previousBestMode ? previousBestStatsRef.current : stats)
            }
                }>Previous best</div>
        </div>

        <div className="statContentContainer">
            <div className="statContent">
                <div className="stats">
                    { currentSessionName && currentSessionName } <br/>
                    { `${currentSessionAltered}` } <br/>
                    { notesPlayed < totalNotes && 'incomplete run' } <br/>
                    { personalBest && 'PEROSNAL BERST!!!'}

                    {/* TODO: Change the percentages to be relative to notes played not total notes */}
                    <p>Total notes:  {selectedTab < 0 ? totalNotes : currentStats[selectedTab].totalNotes}</p>
                    <p>Notes played: {selectedTab < 0 ? notesPlayed : currentStats[selectedTab].notesHit.length + currentStats[selectedTab].notesMissed.length}</p><br/>

                    <p>Notes hit:    {selectedTab < 0 ? notesHit : currentStats[selectedTab].notesHit.length}</p>
                    <p>Hit percentage:    {selectedTab < 0 ? ((notesHit/notesPlayed) * 100).toFixed(2) : 
                    ((currentStats[selectedTab].notesHit.length/
                    (currentStats[selectedTab].notesMissed.length + currentStats[selectedTab].notesHit.length))*100).toFixed(2)}
                    %</p><br/>

                    <p>Notes missed: {selectedTab < 0 ? notesMissed : currentStats[selectedTab].notesMissed.length}</p>
                    <p>Missed percentage: {selectedTab < 0 ? ((notesMissed/notesPlayed) * 100).toFixed(2) : 
                    ((currentStats[selectedTab].notesMissed.length/(currentStats[selectedTab].notesMissed.length + currentStats[selectedTab].notesHit.length))*100).toFixed(2)}
                    %</p><br/>

                    <p>Wrong notes played:  {selectedTab < 0 ? wrongNotes : currentStats[selectedTab].wrongNotes.length}</p><br/>

                    <p>Mean hit deviation: { getAverageDeviation(currentStats) }</p>
                    <p>Median hit deviation: {  getMedianDeviation(currentStats) }</p>
                    <p>Mode hit deviation: {  getRoundedModeDeviation(currentStats) }</p>
                </div>


                    {/* Save stags to bucket. if loaded session, globval session name. save to that. if edit mode is enteredc. session name is set to null. if session name is null. save to local. if eddit mode is opened. set local to null. set to null on lane additions too. compelte and incompelte runs for when played notes less than total notes. only save on complete runs. complete named runs. profile screen shows average hit% for complete runs of preset sessions. daily challenge screen. same rules as for other preset sessions. have tooltip telling you that making additions will disqualify stats. share link for preset sessions  */}

                <div className="graph_container">
                        
                    <div className="graph">
                        { divisionRef.current > 0 && getChart(currentStats) }
                    </div>

                    <div className="graphControls">
                        <button
                        disabled={currentChart == 0} 
                        onClick={() => {
                            setCurrentChart(currentChart-1);
                        }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-left-icon lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                        </button>
                        <p>{chartNames[currentChart]}</p>
                        <button 
                        disabled={currentChart == chartNames.length - 1}
                        onClick={() => {
                            setCurrentChart(currentChart+1);
                        }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-right-icon lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </button>
                    </div>
                </div>
            </div>    
        </div>
    </div>


    </>)
}

export default StatsScreen