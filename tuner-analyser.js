// Import FFT
import {ComplexArray} from './fft.js'


// Set the framerate
const FRAME_PER_SECOND = 20
const FRAME_INTERVAL = 1 / FRAME_PER_SECOND


// Total amount of samples to hold
const SAMPLE_CONST = 48000

// Samples in each batch
const SAMPLE_LEN = 128

// Sampling Frequency 
const SAMPLE_FREQ = 48000

// Real time corresponding to each batch
const SAMPLE_TIME = SAMPLE_LEN / SAMPLE_FREQ

// Frequency range
const MINFREQ = 20
const MAXFREQ = 2000 // Should be more then enough to cope in the case of a max-width canvas




class TunerAnalyser extends AudioWorkletProcessor {

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

  // Get the magnitude of all FFT coefficients within the desired range
  mag() {
      // Slice within range
      let real = this.soundDataFFT.real.slice(MINFREQ, MAXFREQ+1)
      let imag = this.soundDataFFT.imag.slice(MINFREQ, MAXFREQ+1)

      let absolutes = new Array()

      // Calculate the absolute values
      for(let i = 0; i < MAXFREQ-MINFREQ+1; i++) {
        absolutes.push(real[i]**2 + imag[i]**2)
      }

      // Return
      this.soundDataAbs = absolutes
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

        this.mag()
    
        this.port.postMessage([this.soundDataAbs, MINFREQ])
        this.lastUpdate = currentTime
      }
    }

    return true
  }
}

registerProcessor("tuner-analyser", TunerAnalyser)