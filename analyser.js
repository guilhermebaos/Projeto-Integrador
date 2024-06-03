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
let freqPixels
let testing = 0
function updateCanvas(data) {
    // Update frequency 
    canvasPoints.push(data)
    if (canvasPoints.length > canvas.height) {
        canvasPoints.splice(0, 1)
    }


    testing += 1

    let imageData = ctx.createImageData(canvas.width, canvas.height)
    data = imageData.data
    for (let i = 0; i < testing * 1000; i += 4) {
        // Set the color in RGBA
        data[i] = 255
        data[i + 1] = 255
        data[i + 2] = 255
        data[i + 3] = 255
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