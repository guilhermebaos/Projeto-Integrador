// Import FFT
import {ComplexArray} from './fft.js'

// Global variables
let progressBar

// Create AudioContext
const audioContext = new AudioContext()


// Start Processing the Audio
const tunerKnownString = async (context) => {
    await context.audioWorklet.addModule("tuner-known-string.js")

    // Setup Audio Recording
    const mediaStream = await navigator.mediaDevices.getUserMedia({audio: true})
    const micNode = context.createMediaStreamSource(mediaStream)
    const tunerNode = new AudioWorkletNode(context, "tuner-known-string")


    // Connect audio recorder to WorkletNode
    micNode.connect(tunerNode).connect(context.destination)

    // Post Data to HTML
    tunerNode.port.onmessage = ({data}) => {
        letter.innerText = data[3]
        console.log(data[0])
        updateBar(progressBar, data[0], data[1], data[2])
    }
}


// Search window when looking at know string
// https://codepen.io/alvarotrigo/pen/vYeNpjj
const dur = 0.1

const startColor = [94, 252, 141]
const endColor = [218, 44, 56]

function gradient(num) {
    let color = [0, 0, 0]

    if (num < 0) {
        num = 0
    } else if (num > 1) {
        num = 1
    }

    for (let i = 0; i <= 2; i++) {
        color[i] = startColor[i] * (1-num) + endColor[i] * num
    }
    
    return color
}

function updateBar(progressBar, current, freqTarget, tol) {
    // Percentagem de distância do alvo, tendo em conta a tolerância
    let error = (current - freqTarget) / (2 * tol)

    // Cor do gradiente
    let color = gradient(2 * Math.abs(error))

    // Posição em percentagem
    let pos = error + 0.5
    if (pos < 0) {
        pos = 0
    } else if (pos > 1) {
        pos = 1
    }

    // Atualizar a barra
    gsap.to(progressBar, {
        x: `${pos * 100}%`,
        duration: dur,
        backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`
    })

    // Ver se a mão está
    if (Math.abs(pos - 0.5) < 0.03) {
        perfect.style.display = "block"
    } else {
        perfect.style.display = "none"
    }
}


// Start Tuning
let tunerActive = false
window.addEventListener("load", async () => {
    // Get HTML Elements
    const buttonStart = document.getElementById("button-start")
    const buttonStop = document.getElementById("button-stop")

    const perfect = document.getElementById("perfect")
    const letter = document.getElementById("letter")

    progressBar = document.querySelector('.progress-bar')

    buttonStart.disabled = false
    buttonStop.disabled = true

    // Resume the AudioContext and start recording 
    buttonStart.addEventListener("click", async () => {
        if (!tunerActive) {
            await tunerKnownString(audioContext)
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