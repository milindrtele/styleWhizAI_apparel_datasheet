import fs from "fs";
import path from "path";

const baseFolder = path.join("./new_downloaded/downloaded_images/"); // The parent folder containing all subfolders
const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"];
const prefix = "img_";

fs.readdir(baseFolder, (err, folders) => {
  if (err) {
    console.error("Error reading base folder:", err);
    return;
  }

  folders.forEach((folderName) => {
    if (folderName.startsWith(".")) return; // only skip hidden folders return; // Skip hidden folders

    const subfolderPath = path.join(baseFolder, folderName);

    fs.stat(subfolderPath, (err, stats) => {
      if (err || !stats.isDirectory()) return;

      fs.readdir(subfolderPath, (err, files) => {
        if (err) {
          console.error(`Error reading folder ${folderName}:`, err);
          return;
        }

        let count = 1;

        files.forEach((file) => {
          const ext = path.extname(file).toLowerCase();
          if (imageExtensions.includes(ext)) {
            const oldPath = path.join(subfolderPath, file);
            const newPath = path.join(subfolderPath, `${prefix}${count}${ext}`);

            fs.rename(oldPath, newPath, (err) => {
              if (err) {
                console.error(
                  `Failed to rename ${file} in ${folderName}:`,
                  err
                );
              } else {
                console.log(
                  `Renamed ${file} to ${prefix}${count}${ext} in ${folderName}`
                );
              }
            });

            count++;
          }
        });
      });
    });
  });
});
