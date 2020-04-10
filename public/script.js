// canvas / signature code goes here
console.log("js attached");

let context = document.getElementById("canvas").getContext("2d");

let position = {
    x: 0,
    y: 0,
};

function drawSignature() {
    context.strokeStyle = "blue";

    context.beginPath();
    context.moveTo(position.x, position.y); //get from mousedown
    newPosition(event);
    context.lineTo(position.x, position.y); //get from mousemove
    context.stroke();
}

//event listener for mousedown
document
    .getElementById("canvas")
    .addEventListener("mousedown", function(event) {
        console.log("mousedown detected");

        position.x = event.pageX;
        position.y = event.pageY;
    });

document.addEventListener("mousemove", function(event) {
    console.log("mousemove detected");
    context.lineTo(position.x, position.y);
    context.stroke();
});

document.addEventListener("mouseup", function(event) {
    console.log("mouseup detected");
});
