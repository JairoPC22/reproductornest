/**Interfaces para los datos que devuelven todas las funciones
 * de WsIaFunctionsService
 */

export interface ParamsGetVideoFromDB {
    id: string;
    mimetype: string;
    size_bytes: bigint;
}

export interface OutputGetVideoFromS3 {
    pathTempToSaveFile: string;
    pathTemporalFileToSave: string;
    key: string;
}

export interface OutputSplitVideoAndSaveParts {
    videoPartsPaths: string[];
    outputDirForVideoParts: string
}