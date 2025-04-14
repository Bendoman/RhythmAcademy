export default class AudioSprite {
    public src;
    public samples;
    public audioCtx: any;
    public audioBuffer: any;
    
    constructor(settingsObj: any) {
        this.src = settingsObj.src;
        this.samples = settingsObj.sprite;

        this.init();
    }

    async init() {
        // Set up web audio
        const AudioCtx = window.AudioContext;
        this.audioCtx = new AudioCtx;

        // Load file
        this.audioBuffer = await this.getFile();
    }

    async getFile() {
        // Request file
        if(!this.audioCtx) {
            throw new Error('Error during audio sprite initialization');
            return;
        }

        const response = await fetch(this.src);
        if(!response.ok) {
            throw new Error(`${response.url}, ${response.status}`);
        }
    
        console.log(response);

        
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
        console.log(audioBuffer)
        return audioBuffer;
    }

    public play(sampleName: string, gainValue: number = 1) {
        console.log(sampleName)
        const startTime = this.samples[sampleName][0] / 1000;
        const duration = this.samples[sampleName][1] / 1000;


        const gain = this.audioCtx.createGain();
        gain.gain.value = gainValue; 
        
        const sampleSource = this.audioCtx.createBufferSource();
        sampleSource.buffer = this.audioBuffer; 
        // sampleSource.connect(this.audioCtx.destination);
        gain.connect(this.audioCtx.destination)
        sampleSource.connect(gain); 

        sampleSource.start(this.audioCtx.currentTime, startTime, duration);
    }
}
