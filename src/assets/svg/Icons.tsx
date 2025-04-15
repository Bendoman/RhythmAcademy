import { useState } from "react"
import './icons.css';


export const CloseIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
    </svg>)
}

export const LeftArrowIcon = () => {
    return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-left-icon lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
    </svg>)
}

export const RightArrowIcon = () => {
    return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-right-icon lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>)
}

export const HoverDescription = ({ message }: { message: string }) => {
    return (
    <div className="hoverDescription">
        <p>{message}</p>
    </div>)
}

export const QuestionMarkIcon = () => {
    return (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-help-icon lucide-circle-help"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>)
}

export const QuestionMark = ({ message }: { message: string }) => {
    const [displayQuestion, setDisplayQuestion] = useState(false);
    return (
    <div className="questionContainer" 
    onMouseEnter={() => {setDisplayQuestion(true)}}
    onMouseLeave={() => {setDisplayQuestion(false)}}>
        <QuestionMarkIcon/>
        { displayQuestion &&
        <div className="questionTooltip">
            <p>{message}</p>
        </div>}
    </div>)
}

export const AutoPlay = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-music"><path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/></svg>)
}

export const Metronome = () => {
    return (
        <svg fill="currentColor" height="24px" width="24px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 314 314" >
        <path d="M281.853,46.631c-0.39-2.035-1.66-3.794-3.47-4.802l-11.257-6.271l5.297-9.511c1.881-3.378,0.668-7.641-2.709-9.521  c-3.38-1.881-7.641-0.667-9.521,2.709l-5.297,9.511l-11.257-6.269c-1.81-1.008-3.975-1.162-5.908-0.422  c-1.936,0.74-3.442,2.3-4.117,4.259l-13.806,40.109c-1.103,3.207,0.25,6.743,3.213,8.394l4.741,2.642l-23.115,41.501L184.592,17.11  C182.703,7.516,173.563,0,163.783,0h-56.052c-9.778,0-18.918,7.516-20.809,17.11L46.102,224.425  c-0.002,0.012-0.004,0.023-0.006,0.035l-13.729,69.725c-0.998,5.067,0.205,10.132,3.3,13.895C38.76,311.842,43.496,314,48.66,314  h174.195c5.163,0,9.898-2.158,12.993-5.92c3.095-3.763,4.298-8.827,3.301-13.896l-13.732-69.741  c-0.001-0.002-0.001-0.004-0.001-0.004l-16.584-84.225l31.16-55.944l4.742,2.642c1.072,0.598,2.243,0.885,3.402,0.885  c2.046,0,4.056-0.896,5.425-2.571l26.836-32.853C281.708,50.769,282.241,48.665,281.853,46.631z M100.659,19.816  c0.6-3.044,3.971-5.816,7.072-5.816h56.052c3.103,0,6.473,2.771,7.072,5.815l23.249,118.069L164,191.933  c-6.17-2.645-13.121-4.627-21.242-5.363v-14.92h10.96c3.866,0,7-3.134,7-7s-3.134-7-7-7h-10.96v-41.211h10.96c3.866,0,7-3.134,7-7  c0-3.866-3.134-7-7-7h-10.96v-41.21h10.96c3.866,0,7-3.134,7-7s-3.134-7-7-7h-10.96V34.938c0-3.866-3.134-7-7-7  c-3.866,0-7,3.134-7,7v12.291h-10.96c-3.866,0-7,3.134-7,7s3.134,7,7,7h10.96v41.21h-10.96c-3.866,0-7,3.134-7,7  c0,3.866,3.134,7,7,7h10.96v41.211h-10.96c-3.866,0-7,3.134-7,7s3.134,7,7,7h10.96v14.92c-19.447,1.763-32.189,10.688-43.564,18.666  c-7.894,5.536-14.975,10.493-23.52,12.573L100.659,19.816z M225.036,299.188c-0.432,0.523-1.206,0.813-2.181,0.813H48.66  c-0.976,0-1.75-0.289-2.181-0.814c-0.432-0.524-0.565-1.34-0.377-2.297l12.675-64.372c14.147-1.593,24.455-8.807,34.455-15.82  c12.059-8.457,23.448-16.444,42.525-16.444c19.077,0,30.466,7.987,42.524,16.444c10.001,7.014,20.308,14.228,34.456,15.82  l12.675,64.371C225.602,297.846,225.468,298.662,225.036,299.188z M209.842,217.809c-8.545-2.08-15.627-7.037-23.521-12.574  c-3.175-2.227-6.456-4.527-9.959-6.726l21.928-39.367L209.842,217.809z M246.427,71.829l-11.474-6.392l9.177-26.662l20.136,11.216  L246.427,71.829z"/>
        </svg>)
}

export const Eraser = () => {
    return ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-eraser-icon lucide-eraser"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg> )
}

export const LoopIcon = () => {
    return ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-repeat2-icon lucide-repeat-2"><path d="m2 9 3-3 3 3"/><path d="M13 18H7a2 2 0 0 1-2-2V6"/><path d="m22 15-3 3-3-3"/><path d="M11 6h6a2 2 0 0 1 2 2v10"/></svg> )
}

export const SaveIcon = () => {
    return ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg> )
}

export const LoadIcon = () => {
    return ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scroll-text"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg> )
}

export const UserIcon = () => {
    return ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-user-round-icon lucide-circle-user-round"><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></svg> )
}

export const SettingsIcon = () => {
    return ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> )
}

export const ExpanderIcon = () => {
    return ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left-to-line"><path d="M3 19V5"/><path d="m13 6-6 6 6 6"/><path d="M7 12h14"/></svg> )
}

export const EditIcon = () => {
    return ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil-ruler"><path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13"/><path d="m8 6 2-2"/><path d="m18 16 2-2"/><path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg> )
}

export const AddIcon = () => {
    return ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-plus"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg> )
}
