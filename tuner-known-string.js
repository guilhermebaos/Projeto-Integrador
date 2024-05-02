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

      // Loading more sound
      this.soundData = new Array()
      this.loading = true

      // Peak detection
      this.maxTemp = NaN
      this.max = NaN
  }

  identifyMax() {
      
      let N = this.soundDataFFT.length
      let absolutes = new Array()

      for(let i = 0; i < 1000; i++) {
        absolutes.push( (this.soundDataFFT.real[i]**2 + this.soundDataFFT.imag[i]**2 )**.5 )
      }

      let maxValue = Math.max(...absolutes)
      let maxIndex = absolutes.indexOf(maxValue)

      // let delta = ( this.soundDataFFT[maxIndex+1] - this.soundDataFFT[maxIndex-1] ) / (2*this.soundDataFFT[maxIndex] - this.soundDataFFT[maxIndex+1] - this.soundDataFFT[maxIndex-1])
      let delta = 0
      let fpeak = (maxIndex - delta) * SAMPLE_FREQ / N

      this.maxTemp = fpeak
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

        this.identifyMax()

        this.port.postMessage([this.soundDataFFT.real, this.soundDataFFT.imag, this.maxTemp])
        this.lastUpdate = currentTime
      }
    }

    return true
  }
}

registerProcessor("tuner-known-string", TunerKnownString)