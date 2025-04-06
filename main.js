const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({
  log: true,
  corePath: "https://unpkg.com/@ffmpeg/core@0.12.4/dist/ffmpeg-core.js"
});

async function trimLoop() {
  const fileInput = document.getElementById("videoInput");
  const status = document.getElementById("status");
  const preview = document.getElementById("preview");
  const downloadLink = document.getElementById("downloadLink");

  if (!fileInput.files.length) return alert("Upload a video first.");

  const file = fileInput.files[0];
  status.textContent = "Loading FFmpeg...";
  try {
    await ffmpeg.load();
  } catch (e) {
    status.textContent = "Failed to load FFmpeg.";
    console.error(e);
    return;
  }

  status.textContent = "Processing...";
  try {
    ffmpeg.FS("writeFile", "input.mp4", await fetchFile(file));
    await ffmpeg.run("-i", "input.mp4", "-ss", "0", "-t", "5", "-c:v", "copy", "-c:a", "copy", "output.mp4");
    const data = ffmpeg.FS("readFile", "output.mp4");

    const videoBlob = new Blob([data.buffer], { type: "video/mp4" });
    const videoURL = URL.createObjectURL(videoBlob);
    preview.src = videoURL;
    downloadLink.href = videoURL;
    downloadLink.style.display = "inline";
    status.textContent = "Done! You can now download the unlooped video.";
  } catch (err) {
    status.textContent = "An error occurred while processing the video.";
    console.error(err);
  }
}
