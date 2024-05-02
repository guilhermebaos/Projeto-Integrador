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
    const buttonEl = document.getElementById("button-start")
    const meterEl = document.getElementById("volume-meter")

    buttonEl.disabled = false
    meterEl.disabled = false

    // Resume the AudioContext and start recording 
    buttonEl.addEventListener("click", async () => {
        await tunerKnownString(audioContext, meterEl)
        
        audioContext.resume()
        buttonEl.disabled = true
        buttonEl.textContent = "Playing..."

    }, false)
})