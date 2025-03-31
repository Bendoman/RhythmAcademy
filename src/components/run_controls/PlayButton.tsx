interface IPlayButtonProps {
    isPlaying: boolean
    onComponentClick?: () => void; 
}

const PlayButton: React.FC<IPlayButtonProps> = ({ isPlaying, onComponentClick }) => {
  return (<button 
    className={`play_button ${isPlaying ? 'selected' : ''}`} 
    onClick={onComponentClick}>

    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-play"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
  </button>)
}

export default PlayButton
