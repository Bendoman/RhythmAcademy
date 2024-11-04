// ( Canvas Setup )
var canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('main_canvas'));
var ctx = canvas.getContext("2d");
const backgroundColour = "#303030";
const primaryColour = "#FFF";

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

let sound = new Audio('assets/sound/button_press.mp3');
let starttime = Date.now();
console.log(starttime); 

// Store ntoes as hex strings
// Need to have different audio clips for each lane

window.addEventListener("resize", (e) => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
});

const lane_input = {x:width/2, y:height-150, inputWidth:300, inputHeight:50, inputKey:'A', inputActive:false};
const lane = {x:width/2, y:height-150, width:300, height:50, inputKey:'A', inputActive:false};

const laneSection = {}




window.addEventListener("keyup", (e) => {
    // For lane in lanes check if associated inputs are pressed
    if(e.code == "Space") {
        lane_input.inputActive = false; 
        console.log(lane_input.inputActive);
    }
});

function drawBackground() {
    ctx.fillStyle = backgroundColour; 
    ctx.fillRect(0, 0, width, height);
}



let hitzoneX = width/2 - 500;
let hitzoneY = lane_input.y - 175;
let hitzoneWidth = 1000;
let hitzoneHeight = 50; 

let misszoneX = width/2 - 500;
let misszoneY = lane_input.y - 175 + 50;
let misszoneWidth = 1000;
let misszoneHeight = 75; 


let notey = 0;
let inzone = false;
let inmisszone = false;
let inzoneTime = null;
let misstime = null;
let hitStatus = "miss"
let earlyMissTime = null;
function drawLane(x, y, inputWidth, inputHeight, inputkey, inputActive) {
    inmisszone = false;
    inzone = false;
    ctx.fillStyle = "orange";
    if(notey > hitzoneY && notey < hitzoneY + hitzoneHeight) {
        ctx.fillStyle = "red";
        inzoneTime = Date.now();
        inzone = true;
        if(earlyMissTime != null) {
            misstime = 'Miss ' + (inzoneTime - earlyMissTime) + ' milliseconds early.';
            earlyMissTime = null;
            
        }
    } else if (notey > hitzoneY + hitzoneHeight && notey < misszoneY + misszoneHeight) {
        ctx.fillStyle = "blue";
        inmisszone = true;
    }


    ctx.fillRect(x-inputWidth/2, notey, inputWidth, 25);
    if(notey > height)
        notey = 0;
    notey += 4;
    
    ctx.clearRect(x-inputWidth/2, y, inputWidth, 200)
    ctx.fillStyle = backgroundColour;
    ctx.fillRect(x-inputWidth/2, y, inputWidth, 200)

    ctx.strokeStyle = primaryColour; 
    ctx.strokeRect(x-inputWidth/2, y, inputWidth, inputHeight);


    if(inputActive) {
        ctx.fillStyle = "red"
        ctx.fillRect(x-inputWidth/2, y, inputWidth, inputHeight);
    }
    
    ctx.font = "50px calibri"
    ctx.textAlign = "center"
    ctx.fillStyle = primaryColour
    ctx.fillText(inputkey, x, y + inputHeight/2 + 15);
}


window.addEventListener("keypress", (e) => {
    // For lane in lanes check if associated inputs are pressed
    if(e.code == "Space") {
        lane_input.inputActive = true; 
        console.log(lane_input.inputActive);
    }

    sound.cloneNode().play();
    if(inzone) {
        console.log((Date.now() - starttime) / 1000)
        hitStatus = "hit"
        misstime = ''
    } else {
        hitStatus = "miss"
        if(inmisszone)
            misstime = 'Miss ' + (Date.now() - inzoneTime) + ' milliseconds late.';
        else 
            earlyMissTime = Date.now();
    }
});


function drawHitZone(x, y, width, height) {
    ctx.fillStyle = "rgba(255, 100, 0, .5)";
    ctx.clearRect(x,y, width, height);
    ctx.fillRect(x,y, width, height);
    ctx.fillStyle = "rgba(255, 100, 100, .75)";
    ctx.fillRect(x,y+12.5, width, height/2);

    ctx.fillStyle = "rgba(100, 100, 100, .5)";
    ctx.clearRect(misszoneX, misszoneY, hitzoneWidth, misszoneHeight);
    ctx.fillRect(misszoneX, misszoneY, hitzoneWidth, misszoneHeight);
}

function loop() {
    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawHitZone(hitzoneX, hitzoneY, hitzoneWidth, hitzoneHeight); 
    drawLane(lane_input.x, lane_input.y, lane_input.inputWidth, lane_input.inputHeight, lane_input.inputKey, lane_input.inputActive);

    ctx.font = "24px solid Sans-serif"
    ctx.textAlign = "left"
    ctx.fillText(hitStatus, 10, 50)
    // ctx.fillText(inzoneTime, 10, 100)
    ctx.fillText(misstime, 10, 100)
    

    window.requestAnimationFrame(loop);
}
window.requestAnimationFrame(loop);