// Create a audio processor function
class WorkletProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        console.log("Áudio! 2")
        
        // Do something with the data, e.g. convert it to WAV
        console.log(inputs)
        return true
    }
}
  
registerProcessor("worklet-processor", WorkletProcessor);