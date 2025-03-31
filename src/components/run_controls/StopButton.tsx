interface IStopButtonProps {
    isStopped: boolean
    onComponentClick?: () => void; 
}

const StopButton: React.FC<IStopButtonProps> = ({ isStopped, onComponentClick }) => {
  return (<button 
    // TODO: Rename ID 
    id='session_stop_button'
    className={`play_button ${isStopped ? 'selected' : ''}`} 
    onClick={onComponentClick}>

    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-stop"><circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
  </button>)
}

export default StopButton
