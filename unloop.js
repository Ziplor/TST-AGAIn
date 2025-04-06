// /api/unloop.js
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = new formidable.IncomingForm({ uploadDir: '/tmp', keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error parsing file' });

    const inputPath = files.video.filepath;
    const outputPath = `/tmp/unlooped-${Date.now()}.mp4`;

    ffmpeg.setFfmpegPath(ffmpegStatic);

    // Simulated frame anomaly detection (dummy data)
    const issues = [
      { from: 1.23, to: 1.25 },
      { from: 4.56, to: 4.60 }
    ];

    try {
      // Fake processing for demo purposes
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .noAudio()
          .outputOptions('-t 5') // cut first 5s as unlooped demo
          .on('end', resolve)
          .on('error', reject)
          .save(outputPath);
      });

      const buffer = fs.readFileSync(outputPath);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        success: true,
        video: { data: Array.from(buffer) },
        issues
      });

      // Clean up
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    } catch (e) {
      res.status(500).json({ error: 'Video processing failed', details: e.message });
    }
  });
}
