/**Devuelve el tiempor actual con el dia, mes, año, hora, minutos y segundos en string */
export function getCurrentDateAsStrig() {
    const fecha = new Date();
    return `${fecha.getDay()}${fecha.getMonth()}${fecha.getFullYear()}${fecha.getHours()}${fecha.getMinutes()}${fecha.getSeconds()}`
}

