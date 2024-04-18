// Create AudioContext
const audioContext = new AudioContext()

const testing = document.getElementById("testing")

// Start Processing the Audio
const tunerKnownString = async (context, meterElement) => {
    await context.audioWorklet.addModule("tuner-known-string.js")

    const mediaStream = await navigator.mediaDevices.getUserMedia({audio: true})
    const micNode = context.createMediaStreamSource(mediaStream)
    const volumeMeterNode = new AudioWorkletNode(context, "tuner-known-string")

    volumeMeterNode.port.onmessage = ({data}) => {
        meterElement.value = data * 100
    }

    micNode.connect(volumeMeterNode).connect(context.destination)
}


// Start Tuning
window.addEventListener("load", async () => {
    // Get HTML Elements
    const buttonEl = document.getElementById("button-start")
    const meterEl = document.getElementById("volume-meter")

    buttonEl.disabled = false
    meterEl.disabled = false

    // 
    buttonEl.addEventListener("click", async () => {
        await tunerKnownString(audioContext, meterEl)
        
        audioContext.resume()
        buttonEl.disabled = true
        buttonEl.textContent = "Playing..."
    }, false)
})