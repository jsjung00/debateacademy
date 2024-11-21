import fs from "fs";
import os from "os";
import path from "path";

// Takes PDF blob and saves to a temporary file path and returns the file path
export const saveBlobToTemp = async (blob) => {
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, `temp-${Date.now()}.pdf`);

  const buffer = Buffer.from(await blob.arrayBuffer());

  fs.writeFileSync(tempFilePath, buffer);

  return tempFilePath;
};

//Removes the given filepath (not a directory, a single file)
export const cleanupTempFile = (filePath) => {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("Error cleaning temp file:", error);
  }
};
