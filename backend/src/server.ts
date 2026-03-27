import express from "express";
import cors from "cors";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { Scanner } from "./scanner";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const scanner = new Scanner();

app.get("/browse", (_req, res) => {
  try {
    const platform = process.platform;
    let selected = "";

    if (platform === "darwin") {
      selected = execSync(
        `osascript -e 'POSIX path of (choose folder with prompt "Select project folder")'`,
        { encoding: "utf-8", timeout: 60000 },
      ).trim();
    } else if (platform === "linux") {
      selected = execSync("zenity --file-selection --directory --title='Select project folder'", {
        encoding: "utf-8",
        timeout: 60000,
      }).trim();
    } else if (platform === "win32") {
      const ps = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = 'Select project folder'; if ($f.ShowDialog() -eq 'OK') { $f.SelectedPath }`;
      selected = execSync(`powershell -Command "${ps}"`, {
        encoding: "utf-8",
        timeout: 60000,
      }).trim();
    }

    if (!selected) {
      res.status(204).end();
      return;
    }

    res.json({ path: selected });
  } catch {
    res.status(204).end();
  }
});

app.post("/scan", (req, res) => {
  const { path: targetPath } = req.body;

  if (!targetPath || typeof targetPath !== "string") {
    res.status(400).json({ error: "Missing or invalid 'path' in request body" });
    return;
  }

  const resolvedPath = path.resolve(targetPath);

  if (!fs.existsSync(resolvedPath)) {
    res.status(400).json({ error: `Path does not exist: ${resolvedPath}` });
    return;
  }

  try {
    const result = scanner.scan(resolvedPath);
    res.json(result);
  } catch (err: any) {
    console.error("Scan error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Memory Leak Scanner API running on http://localhost:${PORT}`);
});
