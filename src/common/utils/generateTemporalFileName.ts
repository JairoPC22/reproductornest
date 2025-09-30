import { getCurrentDateAsStrig } from "./getDateAsString";

/**Recibe el uuid de un archivo y genera un nombre unico concatentando la primera parte del uuid y el tiempo actual */
export function generateTemporalUnicName(fileId: string) {
    const partesId = fileId.split('-');
    const primeraParteId = `${partesId[0]}${partesId[1]}`;
    const dateNowString = getCurrentDateAsStrig();
    return `${primeraParteId}${dateNowString}`;
}