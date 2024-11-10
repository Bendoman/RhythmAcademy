class Sprite {
    constructor(settingsObj) {
        this.src = settingsObj.src;
        this.samples = settingsObj.sprite;

        this.init();
    }

    async init() {
        // Set up web audio
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx;

        // Load file
        this.audioBuffer = await this.getFile();
    }

    async getFile() {
        // Request file
        const response = await fetch(this.src);
        if(!response.ok) {
            throw new Error(`${response.url}, ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        console.log(audioBuffer)
        return audioBuffer;
    }

    play(sampleName) {
        const startTime = this.samples[sampleName][0] / 1000;
        const duration = this.samples[sampleName][1] / 1000;

        const sampleSource = this.ctx.createBufferSource();
        sampleSource.buffer = this.audioBuffer; 
        sampleSource.connect(this.ctx.destination);

        sampleSource.start(this.ctx.currentTime, startTime, duration);
    }
}

const abc = new Sprite({
  "src": [
    "audio_test/drums.mp3"
  ],
  "sprite": {
    "clap": [
      0,
      734.2630385487529
    ],
    "closed-hihat": [
      2000,
      445.94104308390035
    ],
    "crash": [
      4000,
      1978.6848072562354
    ],
    "kick": [
      7000,
      553.0839002267571
    ],
    "open-hihat": [
      9000,
      962.7664399092968
    ],
    "snare": [
      11000,
      354.48979591836684
    ]
  }
});


window.addEventListener('keydown', (event) => {
  if(event.key == 'k')
    abc.play("kick");

  if(event.key == 's')
    abc.play("snare");
});

// document.getElementById('enable_audio_button').addEventListener('click', () => { 
//     abc.play("b"); 
//     abc.play("a"); 
//     abc.play("b"); 
//     abc.play("a"); 
//     abc.play("b"); 
//     abc.play("a"); 

// });

// abc.init(); 