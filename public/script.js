// canvas / signature code goes here
console.log("javascript attached");

let canvas = document.getElementById("canvas");

let context = canvas.getContext("2d");

let bound = canvas.getBoundingClientRect();

//starting position
let position = {
    x: 0,
    y: 0
};

//event listeners

canvas.addEventListener("mouseenter", newPosition);

canvas.addEventListener("mousemove", drawSignature);

canvas.addEventListener("mouseup", saveSignature);

//work out new position
function newPosition(event) {
    position.x = event.clientX - bound.left;
    position.y = event.clientY - bound.top;
    //console.log("x, y: ", position.x, position.y);
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
    let data = canvas.toDataURL();

    let save_sig = document.getElementById("save_sig");

    save_sig.value = data;

    let signature = save_sig.value;

    console.log("signature: ", signature); //returns a data:image/png value
    //return signature;
}
