window.AudioContext = window.AudioContext || window.webkitAudioContext;
const audioButton = document.getElementById('audio')
const oscilattors = {};

let ctx;
// audioButton.addEventListener('click', () => {
//     ctx = new AudioContext();
//     console.log(ctx);
// })

window.addEventListener('mousemove', () => {
    if(ctx == null) {
        ctx = new AudioContext();
        console.log(ctx);
    }
})


if(navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(success, failure);
}

function success(midiAccess) {
    midiAccess.onstatechange = updateDevices;
    const inputs = midiAccess.inputs;

    inputs.forEach(input => {
        input.onmidimessage = midiMessage;
    });
}

function updateDevices(event) {
    console.log(event);
}

function midiMessage(input) {
    // 153 is on 137 is off
    const command = input.data[0]
    const note = input.data[1]
    const velocity = input.data[2]
    // console.log(command, note, velocity)

    if(velocity > 0) {
        noteOn(note, velocity)
    } else {
        noteOff(note);
    }
}

function failure() {
    console.log('Failed to connect MIDI device');
}


function noteOn(note, velocity) {
    console.log(note, velocity);

    if(oscilattors[note.toString()] != null) {
        return
    }
    const osc = ctx.createOscillator();
    console.log(oscilattors)

    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.4;


    const velocityGainAmount = (1 / 127) * velocity;
    const velocityGain = ctx.createGain();
    velocityGain.gain.value = velocityGainAmount

    osc.type = 'sine';
    osc.frequency.value = midiToFreq(note);
    
    
    osc.connect(oscGain)
    oscGain.connect(velocityGain)
    velocityGain.connect(ctx.destination);
    osc.start();
    oscGain.gain.setValueAtTime(oscGain.gain.value, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    osc.gain = oscGain;
    oscilattors[note.toString()] = osc; 
}

function noteOff(note) {
    console.log(`Stop ${note}`)
    const osc = oscilattors[note.toString()];
    const oscGain = osc.gain; 

    oscGain.gain.setValueAtTime(oscGain.gain.value, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);




    // osc.stop();
    delete oscilattors[note.toString()];
    console.log(oscilattors)
}

function midiToFreq(number) {
    const a = 440;
    return (a / 32) * (2 ** ((number - 9) / 12));
}