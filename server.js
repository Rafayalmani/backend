const express = require("express");
const { spawn } = require("child_process");

const app = express();

app.use(express.static("public"));
app.use(express.json());

app.post("/download", (req, res) => {
  const videoUrl = req.body.url;

  if (!videoUrl) {
    return res.status(400).send("No URL provided");
  }

  res.header("Content-Disposition", "attachment; filename=video.mp4");
  res.header("Content-Type", "video/mp4");

  const ytDlp = spawn("python", [
    "-m",
    "yt_dlp",
    "-f",
    "mp4",
    "-o",
    "-",
    videoUrl
  ]);

  ytDlp.stdout.pipe(res);

  ytDlp.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  ytDlp.on("error", (error) => {
    console.error(error);
    res.status(500).send("Download failed");
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
