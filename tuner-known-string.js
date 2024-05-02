// Import FFT
import {ComplexArray} from '../fft.js'


const FRAME_PER_SECOND = 10
const FRAME_INTERVAL = 1 / FRAME_PER_SECOND

const SAMPLE_CONST = 48000


const SAMPLE_LEN = 128
const SAMPLE_FREQ = 48000

const SAMPLE_TIME = SAMPLE_LEN / SAMPLE_FREQ


class TunerKnownString extends AudioWorkletProcessor {

  constructor() {
      super()
      this.reset()
  }

  reset() {
      console.log("Here!")

      this.lastUpdate = currentTime
      this.lastUpdate = currentTime
      this.soundData = new Array()

      this.loading = true
  }

  calculateRMS() {
    // Calculate the squared-sum.
    let sum = 0
    for (let i = 0; i < this.soundData.length; i++) {
      sum += this.soundData[i] * this.soundData[i]
    }

    // Calculate the RMS level and update the volume.
    let rms = Math.sqrt(sum / this.soundData.length)

    return rms
  }

  process(inputs, outputs) {
    // Get the sound data
    const inputChannelData = inputs[0][0]

    if (this.loading) {
      // Save the new sound data
      this.soundData.push(...inputChannelData)

      // Stop updating
      if (this.soundData.length >= SAMPLE_CONST) {
        this.loading = false
        this.lastUpdate = currentTime
      }
    }

    else {
      // Add the new data and remove the old one
      this.soundData.push(...inputChannelData)
      this.soundData.splice(0, 128)
      

      // Update every frame
      if (currentTime - this.lastUpdate > FRAME_INTERVAL) {
    
        // Send the message to the main JS file
        this.soundDataComplex = new ComplexArray(this.soundData)
        this.soundDataFFT = this.soundDataComplex.FFT()

        this.port.postMessage([this.soundDataFFT.real, this.soundDataFFT.imag])
        this.lastUpdate = currentTime
      }
    }

    return true
  }
}

registerProcessor("tuner-known-string", TunerKnownString)