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

// Guitar strings
const FREQS = [82.4, 110, 146.8, 196, 246.9, 329.6]
const TOLERS = [14, 19, 25, 26, 42, 42]
const LETTERS = ["E2", "A2", "D3", "G3", "B3", "E4"]

// Averaging length
const average = array => array.reduce((a, b) => a + b) / array.length
const AVE = 10

// Smoothing factor (higher is slower, smoother)
// const SMO = 1.1


// Maximum frequency to search for
const MAXFREQ = 500

// HPS k value
let HPSk = 5


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

      // Use HPS
      let absolutesTemp = []
      for (let f = 0; f < MAXFREQ; f++) {
          let result = 1
          for (let j = 1; j <= HPSk; j++) {
              result *= absolutes[f * j]
          }

          absolutesTemp.push(result)
      }

      absolutes = absolutesTemp


      // Find maximum
      let maxValue = Math.max(...absolutes)
      let maxIndex = absolutes.indexOf(maxValue)

      // Correct the maximum
      let a = this.soundDataFFT.real[maxIndex + 1] - this.soundDataFFT.real[maxIndex - 1]
      let b = this.soundDataFFT.imag[maxIndex + 1] - this.soundDataFFT.imag[maxIndex - 1]
      let c = 2 * this.soundDataFFT.real[maxIndex] - this.soundDataFFT.real[maxIndex + 1] - this.soundDataFFT.real[maxIndex - 1]
      let d = 2 * this.soundDataFFT.imag[maxIndex] - this.soundDataFFT.imag[maxIndex + 1] - this.soundDataFFT.imag[maxIndex - 1]
      let delta = Number((a * c + b * d) / (c**2 + d**2)) + 0

      if (delta !== delta) {
          delta = 0
      }

      // Save peak frequency
      let fpeak = (maxIndex - delta) * SAMPLE_FREQ / N
      this.max = fpeak

      // Find closest guitar string
      let dists = new Array()

      for(let i = 0; i < 6; i++){
        dists[i] = Math.abs(fpeak - FREQS[i])
      }

      let minDist = Math.min(...dists)
      let freqIndex = dists.indexOf(minDist)

      // Return values
      this.refFreq = FREQS[freqIndex]
      this.refToler = TOLERS[freqIndex]
      this.refLetter = LETTERS[freqIndex]
  }

  /*
  identifyKnownMax(freq, tol, percent=false) {
      // Calculate tolerance
      if (percent){
        tol = tol * freq / 100
      }

      // Size of the sample
      let trueN = this.soundDataFFT.length
      
      // Slice within tolerance
      let parte_real = this.soundDataFFT.real.slice(freq-tol,freq+tol)
      let parte_imag = this.soundDataFFT.imag.slice(freq-tol,freq+tol)
      let real_and_imag = new ComplexArray(parte_real)
      real_and_imag.imag = parte_imag

      let N = real_and_imag.length
      let absolutes = new Array()

      // Search for peak frequncy in range
      for(let i = 0; i < N; i++) {
        absolutes.push(real_and_imag.real[i]**2 + real_and_imag.imag[i]**2)
      }

      let maxValue = Math.max(...absolutes)
      let maxIndex = absolutes.indexOf(maxValue) + freq - tol

      // Correct the maximum
      let delta = 0
      let fpeak = (maxIndex - delta) * SAMPLE_FREQ / trueN
      this.max = fpeak

      let ind = FREQS.indexOf(freq)

      // Return values
      this.refFreq = freq
      this.refToler = tol
      this.refLetter = ind
  }
  */

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

        // Exponential smoothing
        // nextMax = average(this.lastMax)
        // let jump = Math.exp(-(Math.abs(this.showMax - nextMax) / this.showMax) * SMO)
        // this.showMax = this.showMax * (1 - jump) + nextMax * jump

        this.showMax = average(this.lastMax)
    
        this.port.postMessage([this.showMax, this.refFreq, this.refToler, this.refLetter])
        this.lastUpdate = currentTime
      }
    }

    return true
  }
}

registerProcessor("tuner-known-string", TunerKnownString)