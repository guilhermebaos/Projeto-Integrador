const SMOOTHING_FACTOR = 0.8
const FRAME_PER_SECOND = 60
const FRAME_INTERVAL = 1 / FRAME_PER_SECOND


class TunerKnownString extends AudioWorkletProcessor {

  constructor() {
      super()
      this.lastUpdate = currentTime
      this.volume = 0
  }

  calculateRMS(inputChannelData) {
    // Calculate the squared-sum.
    let sum = 0;
    for (let i = 0; i < inputChannelData.length; i++) {
      sum += inputChannelData[i] * inputChannelData[i]
    }

    // Calculate the RMS level and update the volume.
    let rms = Math.sqrt(sum / inputChannelData.length);
    this.volume = Math.max(rms, this.volume * SMOOTHING_FACTOR);
  }

  process(inputs, outputs) {
    // This example only handles mono channel.
    const inputChannelData = inputs[0][0]

    // Post a message to the node every 16ms.
    if (currentTime - this.lastUpdate > FRAME_INTERVAL) {
      
      this.calculateRMS(inputChannelData)
      this.port.postMessage(this.volume)
      this.lastUpdate = currentTime
    }

    return true;
  }
}

registerProcessor("tuner-known-string", TunerKnownString);