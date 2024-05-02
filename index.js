// Import FFT
import {ComplexArray} from '../fft.js'

// Create AudioContext
const audioContext = new AudioContext()

const testing = document.getElementById("testing")

// Start Processing the Audio
const tunerKnownString = async (context, meterElement) => {
    await context.audioWorklet.addModule("tuner-known-string.js")

    // Setup Audio Recording
    const mediaStream = await navigator.mediaDevices.getUserMedia({audio: true})
    const micNode = context.createMediaStreamSource(mediaStream)
    const tunerNode = new AudioWorkletNode(context, "tuner-known-string")

    console.log(tunerNode)

    // Connect audio recorder to WorkletNode
    micNode.connect(tunerNode).connect(context.destination)

    // Post Data to HTML
    tunerNode.port.onmessage = ({data}) => {
        testing.innerText = data
        console.log(data)
    }
}


// Start Tuning
window.addEventListener("load", async () => {
    // Get HTML Elements
    const buttonStart = document.getElementById("button-start")
    const buttonStop = document.getElementById("button-stop")
    const meterEl = document.getElementById("volume-meter")

    buttonStart.disabled = false
    buttonStop.disabled = true
    meterEl.disabled = false

    // Resume the AudioContext and start recording 
    buttonStart.addEventListener("click", async () => {
        await tunerKnownString(audioContext, meterEl)
        
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