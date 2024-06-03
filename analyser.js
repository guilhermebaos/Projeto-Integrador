// Import FFT
import {ComplexArray} from './fft.js'

// Create AudioContext
const audioContext = new AudioContext()


// Global variables
let canvas
let ctx
let canvasPoints = new Array()

// Start Processing the Audio
const tunerAnalyser = async (context) => {
    await context.audioWorklet.addModule("tuner-analyser.js")

    // Setup Audio Recording
    const mediaStream = await navigator.mediaDevices.getUserMedia({audio: true})
    const micNode = context.createMediaStreamSource(mediaStream)
    const tunerNode = new AudioWorkletNode(context, "tuner-analyser")


    // Connect audio recorder to WorkletNode
    micNode.connect(tunerNode).connect(context.destination)

    // Post Data to HTML
    tunerNode.port.onmessage = ({data}) => {
        updateCanvas(data)
    }
}


// Obter o DPR do ecrã
const DPR = window.devicePixelRatio


// Fix the canvas size, account for DPR
function fixCanvas() {

    // Canvas size
    let larguraCss = +getComputedStyle(canvas).getPropertyValue('width').slice(0, -2)
    let alturaCss = +getComputedStyle(canvas).getPropertyValue('height').slice(0, -2)

    // Change canvas properties
    canvas.width = larguraCss * DPR
    canvas.height = alturaCss * DPR

    // Fix size of HTML element
    canvas.style.width = `${larguraCss}px`
    canvas.style.height = `${alturaCss}px`
}


// Frequency mapping to logarithmic domain
function updateCanvas(soundData) {
    // Update frequency 
    canvasPoints.push(soundData.splice(0, canvas.width))
    if (canvasPoints.length > canvas.height) {
        canvasPoints.splice(0, 1)
    }

    // Data points per line (pixels * 4 because color is RGBA)
    let DPL = 4 * canvas.width

    let imageData = ctx.createImageData(canvas.width, canvas.height)
    let data = imageData.data
    for (let line = 0; line < canvasPoints.length; line += 1) {
        // Get the coefficients of the FFT for this line
        let coefs = canvasPoints[line]

        for (let i = 0; i < 4 * canvas.width; i += 4) {
            // Get color for next coefficient
            let color = getColor(coefs[Math.floor(i / 4)])

            // Set the color in RGBA
            data[line * DPL + i] = color[0]
            data[line * DPL + i + 1] = color[1]
            data[line * DPL + i + 2] = color[2]
            data[line * DPL + i + 3] = 255
        }
    }

    ctx.putImageData(imageData, 0, 0)
}


// Start Analising
let tunerActive = false
window.addEventListener("load", async () => {
    // Get HTML Elements
    const buttonStart = document.getElementById("button-start")
    const buttonStop = document.getElementById("button-stop")

    buttonStart.disabled = false
    buttonStop.disabled = true


    // Get our canvas
    canvas = document.getElementById("freqScreen")
    ctx = canvas.getContext("2d")
    
    // Fix canvas size
    fixCanvas()
    


    // Resume the AudioContext and start recording 
    buttonStart.addEventListener("click", async () => {
        if (!tunerActive) {
            await tunerAnalyser(audioContext)
            tunerActive = true
        }
        
        audioContext.resume()
        buttonStart.disabled = true
        buttonStart.textContent = "Playing..."

        buttonStop.disabled = false

    }, false)

    // Resume the AudioContext and start recording 
    buttonStop.addEventListener("click", async () => {
        audioContext.suspend()
        buttonStart.disabled = false
        buttonStart.textContent = "START"
        
        buttonStop.disabled = true

    }, false)
})


// Given a number, return an element of the ColorMap
const mindB = -80
const maxdB = 20
const maxIndex = 255

const A = maxIndex / (maxdB - mindB)
const B = maxIndex / (1 - maxdB / mindB)

function getColor(num) {
    let dB = 10 * Math.log10(num)
    if (dB <= mindB) {
        return colorMap[0]
    } else {
        return colorMap[Math.floor(A * dB + B)]
    }
}


// ColorMap!
const colorMap = [[0,15,93], [1,15,94], [1,16,96], [1,16,98], [1,17,99], [2,17,101], [2,18,103], [3,18,104], [4,18,106], [5,19,107], [6,19,109], [7,20,111], [8,20,112], [10,21,114], [12,21,115], [13,21,117], [15,22,118], [17,22,119], [18,22,121], [20,23,122], [22,23,124], [24,23,125], [25,24,126], [27,24,128], [29,24,129], [31,25,130], [33,25,131], [35,25,133], [37,25,134], [39,26,135], [41,26,136], [43,26,137], [46,26,138], [48,26,139], [50,27,140], [52,27,141], [55,27,142], [57,27,143], [59,27,143], [62,27,144], [64,27,144], [67,26,145], [70,26,145], [72,26,146], [75,26,146], [78,25,146], [81,25,146], [84,25,146], [86,24,146], [89,24,146], [92,23,146], [94,23,146], [97,23,146], [99,22,146], [102,22,146], [104,21,146], [107,21,146], [109,20,146], [111,20,146], [114,19,146], [116,19,146], [118,18,145], [121,18,145], [123,17,145], [125,17,145], [127,16,145], [129,16,145], [131,15,144], [134,15,144], [136,14,144], [138,14,144], [140,13,143], [142,13,143], [144,13,143], [146,12,142], [148,12,142], [150,11,142], [152,11,141], [154,11,141], [156,10,140], [158,10,140], [160,10,140], [162,10,139], [163,10,139], [165,9,138], [167,9,138], [169,9,138], [171,9,137], [173,9,137], [174,10,136], [176,10,136], [178,10,136], [180,10,135], [182,10,135], [183,11,134], [185,11,134], [187,12,133], [189,12,133], [190,13,133], [192,13,132], [194,14,132], [195,14,131], [197,15,131], [199,16,130], [200,16,130], [202,17,129], [204,18,129], 
[205,19,128], [207,20,128], [208,21,127], [210,22,127], [211,23,126], [213,25,125], [214,26,125], [216,28,124], [217,29,123], [218,31,123], [220,32,122], [221,34,121], [222,35,120], [223,37,120], [224,39,119], [226,41,118], [227,42,117], [228,44,116], [229,46,115], [230,48,114], [231,49,114], [232,51,113], [233,53,112], [234,55,111], [235,57,110], [236,59,108], [237,61,107], [237,62,106], [238,64,105], [239,66,104], [240,68,103], [240,70,102], [241,72,101], [242,74,100], [242,76,98], [243,77,97], [243,79,96], [244,81,95], [244,83,94], [245,85,93], [245,87,92], [246,88,92], [246,90,91], [247,92,90], [247,94,89], [247,96,88], [248,98,87], [248,100,86], [248,101,85], [248,103,85], [248,105,84], [249,107,83], [249,109,82], [249,111,82], [249,112,81], [249,114,80], [249,116,79], [249,118,79], [249,120,78], [249,122,77], [249,123,77], [249,125,76], [249,127,76], [249,129,75], [249,130,74], [249,132,74], [249,134,73], [249,135,72], [249,137,72], [249,138,71], [249,140,70], [249,142,70], [249,143,69], [249,145,68], [249,146,68], [249,148,67], [249,149,66], [249,151,66], [250,152,65], [250,154,65], [250,155,64], [250,157,63], [250,158,63], [250,159,62], [250,161,61], [251,162,61], [251,164,60], [251,165,59], [251,166,59], [251,168,58], [252,169,57], [252,171,57], [252,172,57], [252,173,56], [252,175,56], [252,176,56], [252,177,56], [252,179,56], [252,180,56], [252,182,56], [253,183,56], [253,184,56], [253,186,56], [253,187,56], [253,189,56], [253,190,56], [253,191,56], [253,193,57], [253,194,57], [252,195,57], [252,197,57], [252,198,58], [252,200,58], [252,201,58], [252,202,59], [252,204,59], [252,205,59], [252,206,60], [252,208,60], [252,209,61], [252,211,61], [251,212,62], [251,213,62], [251,215,63], [251,216,63], [251,217,64], [251,219,64], [251,220,65], [250,222,65], [250,223,66], [250,224,66], [250,226,67], [250,227,67], [249,228,68], [249,230,69], [249,231,69], [249,232,70], [248,234,70], [248,235,71], [248,237,72], [248,238,72], [247,239,73], [247,241,74], [247,242,74], [247,243,75], [246,245,76], [246,246,76], [246,247,77], [245,249,78], ]