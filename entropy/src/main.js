import * as THREE from 'three'

THREE

console.log("@");



let newImg = new Image()
newImg.loading = "lazy";
// newImg.width = 320;
// newImg.height = 240;
newImg.src = "asset/ph1.jpeg";

let imgElem = document.querySelector("#img")

console.log(newImg);

imgElem.appendChild(newImg)

