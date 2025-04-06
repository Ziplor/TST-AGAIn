from flask import Flask, request, jsonify, send_file
import os
import uuid
from moviepy.editor import VideoFileClip
import cv2
import librosa
import numpy as np

app = Flask(__name__)
UPLOAD_FOLDER = './uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def detect_loops(video_path):
    cap = cv2.VideoCapture(video_path)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    loops = []

    # Compare every 10th frame with the next 10th frame
    last_frame = None
    for i in range(0, frame_count, 10):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if not ret:
            break
        if last_frame is not None:
            diff = cv2.absdiff(frame, last_frame)
            non_zero_count = np.count_nonzero(diff)
            if non_zero_count < 1000:  # VERY similar frames
                loops.append({"frame": i, "type": "visual"})
        last_frame = frame
    cap.release()
    return loops

def detect_audio_jumps(video_path):
    y, sr = librosa.load(video_path)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    tempo, beats = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
    issues = []
    for i in range(1, len(beats)):
        gap = beats[i] - beats[i-1]
        if gap < 2:
            issues.append({"beat_jump": i, "gap": float(gap)})
    return issues

@app.route('/api/unloop', methods=['POST'])
def unloop():
    if 'video' not in request.files:
        return jsonify({"error": "No video uploaded"}), 400
    video = request.files['video']
    filename = str(uuid.uuid4()) + ".mp4"
    path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    video.save(path)

    visual_loops = detect_loops(path)
    audio_issues = detect_audio_jumps(path)

    clip = VideoFileClip(path).subclip(0, 5)
    output_path = os.path.join(app.config['UPLOAD_FOLDER'], 'unlooped-' + filename)
    clip.write_videofile(output_path, codec='libx264', audio_codec='aac')

    with open(output_path, 'rb') as f:
        video_bytes = f.read()

    return jsonify({
        "success": True,
        "video": list(video_bytes),
        "issues": visual_loops + audio_issues
    })

if __name__ == '__main__':
    app.run(debug=True)
