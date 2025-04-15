import { useState } from "react";
import { useAppContext } from "../AppContextProvider";
import { EditIcon } from "../../assets/svg/Icons";

interface IPauseButtonProps {
    isEditing: boolean;
    onComponentClick?: () => void; 
}

const EditButton: React.FC<IPauseButtonProps> = ({ isEditing, onComponentClick }) => {
    const [hovered, setHovered] = useState(false);
    const {showSessionToolTip} = useAppContext(); 

    return (<button 
        title="Edit mode"
        onMouseEnter={() => {setHovered(true)}}
        onMouseLeave={() => {setHovered(false)}}
        id='edit_mode_button'
        className={`edit_button ${isEditing ? 'selected' : ''}`}
        onClick={onComponentClick}>

        <EditIcon/>

        { showSessionToolTip && hovered && 
        <div className="tooltip">
          Stats for this preset wont count if go into edit mode
          <div className="tooltip-arrow" />
        </div> }
    </button>)
}

export default EditButton
