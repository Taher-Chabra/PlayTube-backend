import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, "../../public/temp");

const storage = multer.diskStorage({
   destination: function (req, file, cb) {
      cb(null, uploadDir);
   },
   filename: function (req, file, cb) {
      cb(null, file.originalname);
   },
});

export const upload = multer({ storage });
