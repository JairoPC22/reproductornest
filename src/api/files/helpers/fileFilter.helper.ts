import { Request } from "express";
import { ValidMimeTypes } from "../../../common/interfaces/valid-mimetypes.enum";

export const fileFilter = (req: Request, file: Express.Multer.File, callback: Function) => {
    // console.log(file);
    //validamos el archivo
    if(!file) return callback(new Error(`File is empty`), false)
                        //si el callback regresa un false, significa que ahí se corta 
                        //todo y no se acepta el archivo, el archivo no pasa a la 
                        //siguiente fase ni nanais

    if (Object.values(ValidMimeTypes).includes(file.mimetype as ValidMimeTypes)){
        return callback(null, true);
    }
    callback(null, false);

}