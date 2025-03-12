import { onStopButtonClick } from '../../scripts/main.ts';
import { StatsObject } from '../../scripts/types.ts';

interface IStopButtonProps {
    isStopped: boolean
    onComponentClick?: () => boolean; 
    setStats: React.Dispatch<React.SetStateAction<StatsObject[]>>;
}

const StopButton: React.FC<IStopButtonProps> = ({ isStopped, onComponentClick, setStats }) => {
  return (<button 
    className={`play_button ${isStopped ? 'selected' : ''}`} 
    onClick={() => { if (onComponentClick && onComponentClick()) setStats(onStopButtonClick()); }}>

    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-stop"><circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
  </button>)
}

export default StopButton
