// ( Canvas Setup )
let laneCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById('lane1_canvas'));
let ctx = /** @type {CanvasRenderingContext2D} */ laneCanvas.getContext("2d");

let contentContainer = document.getElementById('content');

let width = contentContainer.clientWidth;
let height = contentContainer.clientHeight;

laneCanvas.width = width / 6;
laneCanvas.height = height * 0.75;



// ctx.fillRect(0, 0, 100, 100);




// Fetching BPM from input 
const bpmInput = document.getElementById('BPM_input');
let bpm = 40;
bpmInput.addEventListener('change', (event) => {
    let inputValue = parseInt(bpmInput.value);

    // Ensrues that non number values cannot be assigned
    if(isNaN(inputValue)) {
        bpmInput.value = bpm;
        return;
    }

    bpm = bpmInput.value;
    console.log(bpm);
});





let laneHeight = 50000;
let yGap = 50;
let translationSpeed = ((yGap * (bpm/60)) / 60);
// (((yDist/translationSpeed)/fps)*1000)

let hitzoneY = laneCanvas.height - 50;
let translationAmount = 0;


function testDraw() {
    let loops = 0;
    // ctx.fillRect(0, laneCanvas.height - 100, 100, 100);
    for(let y = laneCanvas.height - yGap; y > laneCanvas.height - laneHeight; y -= yGap){
        loops++;
        let yDist = ((hitzoneY - translationAmount - 50) - y)
        ctx.fillStyle = `rgb(${255/(((yDist/translationSpeed)/fps)/1.5)}, 0, 0)`
        if(loops % 15 == 0)
            ctx.fillStyle = 'green'
        ctx.fillRect(laneCanvas.width/2 - laneCanvas.width/4, y, laneCanvas.width/2, 25);

        ctx.fillStyle = 'white'
        ctx.font = "20px sans-serif"


        ctx.fillText(`${(((yDist/translationSpeed)/fps)).toFixed(2)}s to zone`, laneCanvas.width/2 - laneCanvas.width/4, y + 20)
    }

    ctx.fillStyle = 'rgba(50, 255, 50, .5)'
    ctx.fillRect(0, hitzoneY - translationAmount - 50, laneCanvas.width, 50);
    
    
}



// Frame rate related variables
let fps = 0;
let filterStrength = 20; 
let frameTime = 0, lastLoop = new Date, thisLoop;
const fpsParagraph = document.getElementById('fps_pagraph');
const translationParagraph = document.getElementById('translation_pagraph');
ctx.save(); 

let stopGameLoop = false;
function draw() {
    let thisFrameTime = (thisLoop=new Date) - lastLoop;
    frameTime += (thisFrameTime - frameTime) / filterStrength;
    lastLoop = thisLoop;

    if(stopGameLoop)
        return;


    ctx.clearRect(0, laneCanvas.height - laneHeight, laneCanvas.width, laneCanvas.height + laneHeight);
    testDraw();


    translationSpeed = ((yGap * (bpm/60)) / fps);

    ctx.translate(0, translationSpeed);
    translationAmount += translationSpeed;
    
    if(translationAmount > laneHeight) {
        translationAmount = 0;
        ctx.restore();
        ctx.save(); 
    }
    


    translationParagraph.innerText = translationSpeed.toFixed(2);


    fps = (1000/frameTime).toFixed(1);
    fpsParagraph.innerText = `FPS: ${fps}`;

    // Request next frame
    requestAnimationFrame(draw)
}
requestAnimationFrame(draw);