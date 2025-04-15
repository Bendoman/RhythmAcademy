import '../styles/stats_screen.css'
import { StatsObject } from '../../scripts/types';
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../scripts/helpers/supa-client';
import { useAppContext } from '../AppContextProvider';
import { loadFromLocalStorage, saveToLocalStorage } from '../../scripts/helpers/utils';
import { LineChart, Line, Tooltip, CartesianGrid, XAxis, YAxis } from 'recharts';
import { retrieveBucketData as retrieveBucketData, uploadToBucket } from '../../scripts/helpers/supa-utils';
import { CloseIcon, LeftArrowIcon, RightArrowIcon } from '../../assets/svg/Icons';

const StatsScreen = () => {
    const { setShowStats, stats, currentSessionName, currentSessionAltered, setCurrentSessionAltered } = useAppContext(); 
    const [selectedTab, setSelectedTab] = useState(-1);

    // #region ( refs and state )
    let divisionRef = useRef(0);
    let notesHitRef = useRef<number>(0); 
    let wrongNotesRef = useRef<number>(0); 
    let totalNotesRef = useRef<number>(0); 
    let notesMissedRef = useRef<number>(0); 
    let notesPlayedRef = useRef<number>(0); 
    let totalHitPercentageRef = useRef<number>(0); 

    const [notesHit, setNotesHit] = useState(0);
    const [totalNotes, setTotalNotes] = useState(0);
    const [wrongNotes, setWrongNotes] = useState(0);
    const [notesMissed, setNotesMissed] = useState(0);
    const [notesPlayed, setNotesPlayed] = useState(0);
    const [personalBest, setPersonalBest] = useState(false);
    const [previousBestMode, setPreviousBestMode] = useState(false); 

    let currentStatsRef = useRef<StatsObject[]>(stats);
    const [currentStats, setCurrentStats] = useState<StatsObject[]>(currentStatsRef.current);
    
    let previousBestStatsRef = useRef<StatsObject[]>([]);
    const [previousBestStats, setPreviousBestStatsRef] = useState<StatsObject[]>([]);
    // #endregion

    const [currentChart, setCurrentChart] = useState(0);
    let chartNames = [
        'Deviation over time',
        'Hit percentage over time',
        'Hits and Misses over time'
    ]

    // #region ( helpers )
    const handleKeyDown = (event: KeyboardEvent) => {
        if(event.key != 'Escape') { return }; 
        setShowStats(false);
    }
   
    function getHitPercentage(tab: number) {
        if(tab < 0 && notesHitRef.current > 0) {
            return ((notesHitRef.current/notesPlayedRef.current) * 100).toFixed(2);
        } else if(tab >= 0 && currentStats[tab].notesHit.length > 0) {
            let notesHit = currentStats[selectedTab].notesHit.length;
            let notesMissed =currentStats[selectedTab].notesMissed.length;

            return ((notesHit / (notesMissed + notesHit)) * 100).toFixed(2);
        } else {
            return 0; 
        }
    }

    function getMissPercentage(tab: number) {
        if(tab < 0 && notesMissedRef.current > 0) {
            return ((notesMissedRef.current/notesPlayedRef.current) * 100).toFixed(2);
        } else if(tab >= 0 && currentStats[tab].notesMissed.length > 0) {
            let notesHit = currentStats[selectedTab].notesHit.length;
            let notesMissed =currentStats[selectedTab].notesMissed.length;

            return ((notesMissed / (notesHit + notesMissed)) * 100).toFixed(2);
        } else {
            return 0; 
        }
    }

    function uploadStats(userId: string, payload: string) {
        if(userId) {
            uploadToBucket('stats', `${userId}/${currentSessionName}`, currentSessionName, payload); 
        } else {
            saveToLocalStorage(`stats/${currentSessionName}`, payload);
        }
    }
    // #endregion

    // #region ( averages )
    const getAverageDeviation = (statsArray: StatsObject[]) => {
        let average = 0; 
        if(selectedTab < 0) {
            let trueLength = 0; 
            statsArray.forEach(statObject => {
                let hits = statObject.notesHit;
                if(hits.length > 0) { trueLength++ }
                average += hits.length > 0 
                ? hits.reduce((sum, note) => sum + note.timeToZone, 0) / hits.length 
                : 0; 
            });
            if (trueLength === 0) return "N/A";
            average = average > 0 ? average/trueLength : 0; 
        } else {
            let hits = statsArray[selectedTab].notesHit;
            if (hits.length === 0) return "N/A";
            average = hits.length > 0 
            ? hits.reduce((sum, note) => sum + note.timeToZone, 0) / hits.length 
            : 0; 
        }
        return average > 0 
        ? `${Math.abs(average).toFixed(0)}ms early` 
        : `${Math.abs(average).toFixed(0)}ms late`; 
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
        return median > 0 
        ? `${Math.abs(median).toFixed(0)}ms early` 
        : `${Math.abs(median).toFixed(0)}ms late`;
    }

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
    }
    // #endregion

    // #region ( chart generation )
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
            node.hitPercentage = node.hitNotes > 0 
            ? parseInt(((node.hitNotes / (node.missedNotes + node.hitNotes)) * 100).toFixed(2))
            : 0; 
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
        let secondStroke = '';
        let thirdStroke = '';

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
            axisKey = 'interval';
            secondLine = true; 

            linekey = 'hitNotes';
            secondLineKey = 'missedNotes'
            thirdLineKey = 'wrongNotes'
            
            unit = '';
            stroke = '#39d641'
            secondStroke = '#b83822'
            thirdStroke = '#dfd21f';
        }

        let minWidth = 400;

        return (
            <LineChart width={divisionRef.current*50 > minWidth ? divisionRef.current*50 : minWidth} height={300} data={data} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
            
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
    // #endregion

    const saveStats = async () => {
        const userId = (await supabase.auth.getUser()).data.user?.id as string;

        if(!currentSessionAltered && currentSessionName) {    
            let content = { statsObjectArray: stats, totalHitPercentage: totalHitPercentageRef.current };
            let payload = JSON.stringify(content); 
            
            let data; 
            if(userId) {
                data = await retrieveBucketData('stats', `${userId}/${currentSessionName}`);
            } else {
                data = await loadFromLocalStorage(`stats/${currentSessionName}`);
            }
            if(!data && notesPlayedRef.current == totalNotesRef.current) {
                // No previous best exists and run is complete
                setPersonalBest(true);
                uploadStats(userId, payload); 
            } else if(data) {
                // Previous best exists
                if(data.totalHitPercentage! < content.totalHitPercentage && notesPlayedRef.current == totalNotesRef.current) {
                    setPersonalBest(true);
                    uploadStats(userId, payload); 
                } else {
                    // Previous best is better than current
                    previousBestStatsRef.current = data.statsObjectArray;
                    setPreviousBestStatsRef(previousBestStatsRef.current);
                }
            }
        } else if(!currentSessionAltered) {
            // Local storage for non saved sessions
            let content = {
                statsObjectArray: stats, 
                totalHitPercentage: totalHitPercentageRef.current
            }

            const previousStats = loadFromLocalStorage('stats'); 
            if(!previousStats && notesPlayedRef.current == totalNotesRef.current) {
                // Complete run with no previous best
                setPersonalBest(true);
                saveToLocalStorage('stats', JSON.stringify(content));
            } else if(previousStats && notesPlayedRef.current == totalNotesRef.current) {
                if(content.totalHitPercentage > previousStats.totalHitPercentage!) {
                    // Complete run better than previous best
                    setPersonalBest(true);
                    saveToLocalStorage('stats', JSON.stringify(content));
                } 
            } else if(previousStats) {
                // Previous best better than current
                previousBestStatsRef.current = previousStats.statsObjectArray;
                setPreviousBestStatsRef(previousBestStatsRef.current);
            }
        }
    }

    function populateStats(statsArray: StatsObject[]) {
        // Rounds to the nearest second
        let maxTime = Math.ceil(statsArray[0].runTotalTime / 1000) * 1000; 
        let divisions = maxTime/1000; 
        divisionRef.current = divisions;        

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

        return () => { 
            window.removeEventListener('keydown', handleKeyDown); 
            setCurrentSessionAltered(false); 
        }
    }, []);

    return (
    <div className="statsScreen screen">
        <div className="closeContainer" onClick={()=> { setShowStats(false); }}>
            <CloseIcon/>
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
            // TODO: Should have a different background for hover and selected
            className={`tab ${previousBestMode ? 'selected' : ''} ${previousBestStats.length == 0 ? 'disabled' : ''}`}
            onClick={()=>{
                if(previousBestStats.length == 0) { return } 
                setPreviousBestMode(!previousBestMode); 
                currentStatsRef.current = !previousBestMode ? previousBestStatsRef.current : stats;
                setCurrentStats(currentStatsRef.current);
            }}>Previous best</div>
        </div>

        <div className="statContentContainer">
            <div className="statContent">
                <div className="stats">
                    <p>Current session altered: {currentSessionAltered ? "true" : "false"}</p>
                    { currentSessionName && <p className='stats_title'>{`Stats for session: "${currentSessionName}"`}</p> } 
                    { personalBest && <><p>New Personal Best!</p><br/></> }  
                    { notesPlayed < totalNotes && <><p>Incomplete run</p><br/></> }

                    {/* TODO: Change the percentages to be relative to notes played not total notes */}
                    <p>Total notes:  {selectedTab < 0 ? totalNotes : currentStats[selectedTab].totalNotes}</p>
                    <p>Notes played: {selectedTab < 0 ? notesPlayed : currentStats[selectedTab].notesHit.length + currentStats[selectedTab].notesMissed.length}</p><br/>

                    <p>Notes hit:    {selectedTab < 0 ? notesHit : currentStats[selectedTab].notesHit.length}</p>
                    <p>Hit percentage:    {getHitPercentage(selectedTab)}%</p><br/>

                    <p>Notes missed: {selectedTab < 0 ? notesMissed : currentStats[selectedTab].notesMissed.length}</p>
                    <p>Missed percentage:   {getMissPercentage(selectedTab)}%</p><br/>

                    <p>Wrong notes played:  {selectedTab < 0 ? wrongNotes : currentStats[selectedTab].wrongNotes.length}</p><br/>

                    <p>Mean hit deviation: { getAverageDeviation(currentStats) }</p>
                    <p>Median hit deviation: {  getMedianDeviation(currentStats) }</p>
                    <p>Mode hit deviation: {  getRoundedModeDeviation(currentStats) }</p>
                </div>

                <div className="graph_container">
                    <div className="graph">
                        { divisionRef.current > 0 && getChart(currentStats) }
                    </div>

                    <div className="graphControls">
                        <button
                        disabled={currentChart == 0} 
                        onClick={() => { setCurrentChart(currentChart-1) }}>
                            <LeftArrowIcon/>
                        </button>
                        
                        <p>{chartNames[currentChart]}</p>
                        
                        <button 
                        disabled={currentChart == chartNames.length - 1}
                        onClick={() => { setCurrentChart(currentChart+1) }}>
                            <RightArrowIcon/>
                        </button>
                    </div>
                </div>
            </div>    
        </div>
    </div>)
}

export default StatsScreen