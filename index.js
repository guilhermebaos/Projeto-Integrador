// Import FFT
import {ComplexArray} from './fft.js'

// Global variables
let progressBar
let perfect

const LETTERS = ["E2", "A2", "D3", "G3", "B3", "E4"]
let guitar = []

let freqShow


// How long between each message to ESP32 (in miliseconds)
const MQTTwait = 500
let now = Date.now()

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
        escolherLetra(data[3])
        updateBar(progressBar, data[0], data[1], data[2])

        freqShow.innerText = `${data[0].toFixed(1)}`

        // Send to ESP32 via MQTT
        if (Date.now() - now >= MQTTwait) {
            client.publish(topico, `${data[0]}|${data[1]}`)
            now = Date.now()
        }
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
        perfect.style.opacity = "1"
    } else {
        perfect.style.opacity = "0"
    }
}


function escolherLetra(str) {
    let index = LETTERS.indexOf(str)

    for (let i = 0; i < LETTERS.length; i++) {
        if (i == index) {
            guitar[i].style.backgroundColor = "rgb(94, 252, 141)"
            guitar[i].style.color = "black"
        } else {
            guitar[i].style.backgroundColor = "unset"
            guitar[i].style.color = "white"
        }
    }
}


// Start Tuning
let tunerActive = false
window.addEventListener("load", async () => {
    // Get HTML Elements
    const buttonStart = document.getElementById("button-start")
    const buttonStop = document.getElementById("button-stop")

    perfect = document.getElementById("perfect")

    for (let i = 0; i < 6; i++) {
        guitar.push(document.getElementById(LETTERS[i]))
    }

    progressBar = document.querySelector('.progress-bar')

    freqShow = document.getElementById("freqShow")

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
        buttonStart.textContent = "A Gravar..."

        buttonStop.disabled = false

    }, false)

    // Resume the AudioContext and start recording 
    buttonStop.addEventListener("click", async () => {
        audioContext.suspend()
        buttonStart.disabled = false
        buttonStart.textContent = "START"
        
        buttonStop.disabled = true

        updateBar(progressBar, 0, 1e3, 1)
        freqShow.innerText = `0.0`

    }, false)
})



// Connect to the MQTT broker using WebSockets
const client = mqtt.connect('ws://broker.emqx.io:8083/mqtt')
const topico = "afinador-site"

client.on('connect', function () {
    console.log('Connected')

    // Subscribe to a topic
    client.subscribe(topico, function (err) {
        if (!err) {
            console.log('Subscribed to topic')
        } else {
            console.log(err)
        }
    })

    // Publish to a topic
    client.publish(topico, 'Connection is OK!')
})

// Handle incoming messages
client.on('message', function (topic, message) {

    // Message is Buffer
    console.log(`Received message: ${message.toString()} on topic: ${topic}`)
})