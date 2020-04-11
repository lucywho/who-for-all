// canvas / signature code goes here
console.log("javascript attached");

let context = document.getElementById("canvas").getContext("2d");

//starting position
let position = {
    x: 0,
    y: 0,
};

//event listeners
document.getElementById("canvas").addEventListener("mousedown", newPosition);

document.getElementById("canvas").addEventListener("mouseenter", newPosition);

document.getElementById("canvas").addEventListener("mousemove", drawSignature);

//work out new position
function newPosition(event) {
    console.log("mousedown detected");
    //TODO: work out how to remove offset
    position.x = event.pageX;
    position.y = event.pageY;
}

//draw lines
function drawSignature(event) {
    console.log("mousemove detected");
    if (event.buttons !== 1) {
        return;
    }

    context.beginPath();
    context.strokeStyle = "blue";

    context.moveTo(position.x, position.y);
    newPosition(event);
    context.lineTo(position.x, position.y);
    context.stroke();
}

//save canvas image to save-sig field
let canvas = document.getElementById("canvas");
let signature = canvas.toDataURL();
console.log(signature);
