// Get Audio Access
const player = document.getElementById('player')

const downloadLink = document.getElementById('download')
const stopButton = document.getElementById('stop')

const handleSuccess = async function(stream) {
    const options = {mimeType: 'audio/webm'}
    const recordedChunks = []
    const mediaRecorder = new MediaRecorder(stream, options)

    mediaRecorder.addEventListener('dataavailable', function(e) {
        if (e.data.size > 0) recordedChunks.push(e.data)
    })

    mediaRecorder.addEventListener('stop', function() {
        downloadLink.href = URL.createObjectURL(new Blob(recordedChunks))
        downloadLink.download = 'acetest.wav'
    })

    stopButton.addEventListener('click', function() {
        mediaRecorder.stop()
    })

    mediaRecorder.start()
}

navigator.mediaDevices
    .getUserMedia({audio: true, video: false})
    .then(handleSuccess)

