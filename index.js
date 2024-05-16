// Import FFT
import {ComplexArray} from './fft.js'

// Create AudioContext
const audioContext = new AudioContext()

const testing = document.getElementById("testing")

// Search window when looking at know string
const tol = 40

// Start Processing the Audio
const tunerKnownString = async (context) => {
    await context.audioWorklet.addModule("tuner-known-string.js")

    // Setup Audio Recording
    const mediaStream = await navigator.mediaDevices.getUserMedia({audio: true})
    const micNode = context.createMediaStreamSource(mediaStream)
    const tunerNode = new AudioWorkletNode(context, "tuner-known-string")

    tunerNode.port.postMessage


    // Connect audio recorder to WorkletNode
    micNode.connect(tunerNode).connect(context.destination)

    // Post Data to HTML
    tunerNode.port.onmessage = ({data}) => {
        testing.innerText = data[2]
    }
}



function updateBar(progressBar, target, current) {
    // Percentagem de distância do alvo, tendo em conta a tolerância
    pos = (current - target) / (2 * tol) + 0.5

    if (pos < 0) {
        pos = 0
    } else if (pos > 1) {
        pos = 1
    }

    gsap.to(progressBar, {
        x: `${target}%`,
        duration: 2,
    });
}


// Start Tuning
let tunerActive = false
window.addEventListener("load", async () => {
    // Get HTML Elements
    const buttonStart = document.getElementById("button-start")
    const buttonStop = document.getElementById("button-stop")

    const progressBarContainer = document.querySelector('.progress-bar__container')
    const progressBar = document.querySelector('.progress-bar')

    const progressBarStates = [0, 7, 27, 34, 68, 80, 95, 100];

    let time = 0;
    let endState = 100;

    progressBarStates.forEach(state => {
    let randomTime = Math.floor(Math.random() * 3000);
    setTimeout(() => {
        if(state == endState){
        gsap.to(progressBar, {
            x: `${state}%`,
            duration: 2,
            backgroundColor: '#4895ef',
            onComplete: () => {
            progressBarText.style.display = "initial";
            progressBarContainer.style.boxShadow = '0 0 5px #4895ef';
            }
        });
        }else{
        gsap.to(progressBar, {
            x: `${state}%`,
            duration: 2,
        });
        }
    }, randomTime + time);
    time += randomTime;
    })


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