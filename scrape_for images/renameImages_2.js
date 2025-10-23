import fs from "fs";
import path from "path";

const baseFolder = path.resolve("./new_downloaded/downloaded_images"); // Parent folder containing subfolders
const targetFolder = path.resolve("./all_images"); // Destination folder
const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"];

// Create target folder if it doesn't exist
if (!fs.existsSync(targetFolder)) {
  fs.mkdirSync(targetFolder, { recursive: true });
}

fs.readdir(baseFolder, (err, folders) => {
  if (err) {
    console.error("Error reading base folder:", err);
    return;
  }

  folders.forEach((folderName) => {
    const subfolderPath = path.join(baseFolder, folderName);

    fs.stat(subfolderPath, (err, stats) => {
      if (err || !stats.isDirectory()) return;

      fs.readdir(subfolderPath, (err, files) => {
        if (err) {
          console.error(`Error reading folder ${folderName}:`, err);
          return;
        }

        files.forEach((file) => {
          const ext = path.extname(file).toLowerCase();
          if (!imageExtensions.includes(ext)) return;

          const srcPath = path.join(subfolderPath, file);
          const destPath = path.join(targetFolder, file);

          // If a file with the same name exists, add a number suffix
          let finalDest = destPath;
          let count = 1;
          while (fs.existsSync(finalDest)) {
            const name = path.basename(file, ext);
            finalDest = path.join(targetFolder, `${name}_${count}${ext}`);
            count++;
          }

          fs.copyFile(srcPath, finalDest, (err) => {
            if (err) console.error(`Error copying ${file}:`, err);
            else console.log(`Copied ${file} to ${finalDest}`);
          });
        });
      });
    });
  });
});
