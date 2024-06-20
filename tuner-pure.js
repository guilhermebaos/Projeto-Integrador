// Import FFT
import {ComplexArray} from './fft.js'


// Set the framerate
const FRAME_PER_SECOND = 10
const FRAME_INTERVAL = 1 / FRAME_PER_SECOND


// Total amount of samples to hold
const SAMPLE_CONST = 48000

// Samples in each batch
const SAMPLE_LEN = 128

// Sampling Frequency 
const SAMPLE_FREQ = 48000

// Real time corresponding to each batch
const SAMPLE_TIME = SAMPLE_LEN / SAMPLE_FREQ

// Averaging length
const average = array => array.reduce((a, b) => a + b) / array.length
const AVE = 10

// Smoothing factor (higher is slower, smoother)
// const SMO = 1.1


// Maximum frequency to search for
const MAXFREQ = 2000


class TunerKnownString extends AudioWorkletProcessor {

  constructor() {
      super()
      this.reset()
  }

  reset() { 
      // Get the time
      this.lastUpdate = currentTime

      // Loading more sound
      this.soundData = new Array()
      this.loading = true

      // Peak detection
      this.max = NaN
      this.showMax = NaN
      this.lastMax = new Array()

      // Auto-identify peaks
      this.refFreq = NaN
      this.refToler = NaN
  }

  identifyMax() {
      // Size of the sample
      let N = this.soundDataFFT.length
      let absolutes = new Array()

      // Search for peak frequncy in range
      for(let i = 0; i < HPSk * MAXFREQ; i++) {
        absolutes.push(this.soundDataFFT.real[i]**2 + this.soundDataFFT.imag[i]**2)
      }

      // Find maximum
      let maxValue = Math.max(...absolutes)
      let maxIndex = absolutes.indexOf(maxValue)

      // Correct the maximum
      let delta = 0
      let fpeak = (maxIndex - delta) * SAMPLE_FREQ / N
      this.max = fpeak
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
        this.lastMax.push(this.max)
        if (this.lastMax.length == 1) {
          this.showMax = average(this.lastMax)
        }
        if (this.lastMax.length > AVE) {
          this.lastMax.splice(0, 1)
        }

        this.showMax = average(this.lastMax)
    
        this.port.postMessage([this.showMax])
        this.lastUpdate = currentTime
      }
    }

    return true
  }
}

registerProcessor("tuner-known-string", TunerKnownString)