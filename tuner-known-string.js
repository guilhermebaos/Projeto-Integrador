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

// Smoothing factor
const ALPHA = 0.7


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

      this.max = fpeak
  }

  identifyKnownMax(freq, tol, percent=false) {

      if (percent){
        tol = tol * freq / 100
      }

      let trueN = this.soundDataFFT.length
      
      let parte_real = this.soundDataFFT.real.slice(freq-tol,freq+tol)
      let parte_imag = this.soundDataFFT.imag.slice(freq-tol,freq+tol)
      let real_and_imag = new ComplexArray(parte_real)
      real_and_imag.imag = parte_imag

      let N = real_and_imag.length
      let absolutes = new Array()

      for(let i = 0; i < N; i++) {
        absolutes.push( (real_and_imag.real[i]**2 + real_and_imag.imag[i]**2 )**.5 )
      }

      let maxValue = Math.max(...absolutes)
      let maxIndex = absolutes.indexOf(maxValue) + freq - tol

      // let delta = ( this.soundDataFFT[maxIndex+1] - this.soundDataFFT[maxIndex-1] ) / (2*this.soundDataFFT[maxIndex] - this.soundDataFFT[maxIndex+1] - this.soundDataFFT[maxIndex-1])
      let delta = 0
      let fpeak = (maxIndex - delta) * SAMPLE_FREQ / trueN

      this.max = fpeak
  }

  identifyKnownMax(freq, tol, percent=false) {

      if (percent){
        tol = tol * freq / 100
      }

      let trueN = this.soundDataFFT.length
      
      let parte_real = this.soundDataFFT.real.slice(freq-tol,freq+tol)
      let parte_imag = this.soundDataFFT.imag.slice(freq-tol,freq+tol)
      let real_and_imag = new ComplexArray(parte_real)
      real_and_imag.imag = parte_imag

      let N = real_and_imag.length
      let absolutes = new Array()

      for(let i = 0; i < N; i++) {
        absolutes.push( (real_and_imag.real[i]**2 + real_and_imag.imag[i]**2 )**.5 )
      }

      let maxValue = Math.max(...absolutes)
      let maxIndex = absolutes.indexOf(maxValue) + freq - tol

      // let delta = ( this.soundDataFFT[maxIndex+1] - this.soundDataFFT[maxIndex-1] ) / (2*this.soundDataFFT[maxIndex] - this.soundDataFFT[maxIndex+1] - this.soundDataFFT[maxIndex-1])
      let delta = 0
      let fpeak = (maxIndex - delta) * SAMPLE_FREQ / trueN

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

        // this.identifyKnownMax(440, 100)
        this.identifyMax()
        if (this.maxTemp) {
          this.max = this.max * ALPHA + this.maxTemp * (1 - ALPHA)
          this.maxTemp = this.max
        } else {
          this.maxTemp = this.max
        }

        this.port.postMessage([this.soundDataFFT.real, this.soundDataFFT.imag, this.max])
        this.lastUpdate = currentTime
      }
    }

    return true
  }
}

registerProcessor("tuner-known-string", TunerKnownString)