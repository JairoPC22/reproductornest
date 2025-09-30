/**Esta interface se utiliza para filtrar la información de los archivos que se
 * devuelven al usuario en la clase FilesService en el método getAllFilesFromOneUser
 */
export interface filesFromOneUser {
    id: string;
    name: string;
    file_type: string;
    extension: string;
    mimetype: string;
    size_bytes: bigint;
    created_at: Date;
    updated_at: Date;
}