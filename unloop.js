import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

export const config = {
  api: {
    bodyParser: false,
  },
};

function fakeDetectLoop(videoPath) {
  return [
    { from: 1.23, to: 1.25 },
    { from: 4.56, to: 4.60 },
  ];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = new formidable.IncomingForm({ uploadDir: '/tmp', keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'File upload error' });

    const inputPath = files.video.filepath;
    const outputPath = `/tmp/unlooped-${Date.now()}.mp4`;

    ffmpeg.setFfmpegPath(ffmpegStatic);

    try {
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .noAudio()
          .outputOptions('-t 5') // simulate an unlooped result
          .on('end', resolve)
          .on('error', reject)
          .save(outputPath);
      });

      const buffer = fs.readFileSync(outputPath);
      const issues = fakeDetectLoop(inputPath);

      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        success: true,
        video: { data: [...buffer] },
        issues,
      });

      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    } catch (e) {
      res.status(500).json({ error: 'FFmpeg processing failed', details: e.message });
    }
  });
}
