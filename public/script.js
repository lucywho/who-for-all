let canvas = document.getElementById("canvas");

let context = canvas.getContext("2d");

let bound = canvas.getBoundingClientRect();

let position = {
    x: 0,
    y: 0,
};

canvas.addEventListener("mouseenter", newPosition);

canvas.addEventListener("mousemove", drawSignature);

canvas.addEventListener("mouseup", saveSignature);

function newPosition(event) {
    position.x = event.clientX - bound.left;
    position.y = event.clientY - bound.top;
}

function drawSignature(event) {
    if (event.buttons !== 1) {
        return;
    }

    context.strokeStyle = "navy";

    context.moveTo(position.x, position.y);
    newPosition(event);
    context.lineTo(position.x, position.y);
    context.stroke();
}

function saveSignature() {
    let data = canvas.toDataURL();

    let save_sig = document.getElementById("save_sig");

    save_sig.value = data;

    let signature = save_sig.value;

    console.log("signature: ", signature);
}
