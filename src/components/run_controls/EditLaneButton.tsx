import React from 'react'
import { findLaneFromCanvas, sendCanvasToEditMode } from '../../scripts/main';
import Lane from '../../scripts/classes/Lane';

interface IEditLaneButtonProps {
    canvas: HTMLCanvasElement;
}

const EditLaneButton: React.FC<IEditLaneButtonProps> = ({ canvas }) => {
    let lane: Lane = findLaneFromCanvas(canvas); 
    
    return (
        <div className='edit_lane_button'>
            <button title='Edit lane' 
            onClick={() => {
                (document.querySelector('#edit_mode_button') as HTMLElement)?.click();
                sendCanvasToEditMode(canvas);
            }}>
                Edit Lane
            </button>
        </div>
    )
}

export default EditLaneButton