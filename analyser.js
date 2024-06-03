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
        ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
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
    canvas = document.getElementById('freqScreen')
    ctx = canvas.getContext('2d')


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