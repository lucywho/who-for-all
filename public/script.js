// canvas / signature code goes here
console.log("javascript attached");

let context = document.getElementById("canvas").getContext("2d");

let canvas = document.getElementById("canvas");

//starting position
let position = {
    x: 0,
    y: 0,
};

//event listeners
canvas.addEventListener("mousedown", newPosition);

canvas.addEventListener("mouseenter", newPosition);

canvas.addEventListener("mousemove", drawSignature);

canvas.addEventListener("mouseup", saveSignature);

//work out new position
function newPosition(event) {
    //TODO: work out how to remove offset
    position.x = event.clientX;
    position.y = event.clientY;
    console.log("x, y: ", position.x, position.y);
}

//draw lines
function drawSignature(event) {
    if (event.buttons !== 1) {
        return;
    }

    context.strokeStyle = "blue";

    context.moveTo(position.x, position.y);
    newPosition(event);
    context.lineTo(position.x, position.y);
    context.stroke();
}

//save canvas image to save-sig field
function saveSignature() {
    let sig = canvas.toDataURL();
    document.getElementById("save_sig").val(sig);
}
