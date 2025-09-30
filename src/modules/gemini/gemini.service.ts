import {
    createPartFromUri,
    GoogleGenAI,
    File as FileGenai,
    GenerateContentResponse,
    GenerateContentConfig,
    FunctionDeclaration,
    FunctionCallingConfigMode,
    Content,
    ApiError,
    createUserContent,
    CachedContent
} from "@google/genai";
import { Injectable, Logger } from "@nestjs/common";
import { FileForGemini } from "./interfaces/fileUpload.interface";

@Injectable()
export class GeminiService {

    //Variables para verificar que un archivo ya este listo en gemini
    private readonly MAX_ATTEMPTS = 30;
    private readonly DELAY_MS = 5000; //5s

    private readonly logger = new Logger('gemini.service');
    private readonly ai: GoogleGenAI;
    private readonly modelName: string;

    constructor(apiKey: string, model_name: string) {
        this.ai = new GoogleGenAI({ apiKey });
        this.modelName = model_name;
    }

    //FILES

    async loadLocallyStoredFile(fileForGemini: FileForGemini): Promise<FileGenai> {
        try {
            const file = await this.ai.files.upload({
                file: fileForGemini.pathWithFilenameAndWxtension,
                config: {
                    displayName: fileForGemini.filenameWithExtension, //nombre.pdf
                    mimeType: fileForGemini.mimeType
                }
            })
            return file;
        } catch (error) {
            this.logger.error(`Error in 'loadLocallyStoredFile' -> ${error}`);
            if (error instanceof ApiError) {
                throw error;

            } else {
                const newError = new Error(`Error uploading file to Dacuai AI`);
                newError.name = 'GEMINI';
                newError.cause = error;
                throw newError;
            }
        }
    }

    async uploadMultipleFiles(files: FileForGemini[]): Promise<FileGenai[]> {
        const filesInGemini = await Promise.all(
            files.map(file => this.loadLocallyStoredFile(file))
        ).catch((reject) => {
            throw reject; //Se lanza el loadLocallyStoredFile
        })
        return filesInGemini;
    }

    async getFile(name: string) {
        try {
            return await this.ai.files.get({ name });
        } catch (error) {
            /**Si el archivo ya no existe aparece esto:
             * ApiError: {"error":{"code":403,"message":"You do not have permission to access the File 4u2xa0q1lrm4 or it may not exist.","status":"PERMISSION_DENIED"}}
             */
            this.logger.error(`Error in 'getFile' -> ${error}`);
            if (error instanceof ApiError) {
                throw error;

            } else {
                const newError = new Error(`Error uploading file to Dacuai AI`);
                newError.name = 'GEMINI';
                newError.cause = error;
                throw newError;
            }
        }
    }

    async deleteFiles() {
        //Todo: optimizar la subida de archivos
        const listFilesInGemini = await this.ai.files.list();
        let counter: number = 0;
        for await (const file of listFilesInGemini) {
            counter += 1
            this.ai.files.delete({ name: file.name! });
        }
        this.logger.debug(`${counter} files deleted in gemini`);
    }

    async deleteOneFile(nameFile: string) {
        await this.ai.files.delete({ name: nameFile });
    }

    async listFiles(): Promise<FileGenai[]> {
        const pager = await this.ai.files.list({ config: { pageSize: 10 } });
        let result: FileGenai[] = [];
        let page = pager.page;
        while (true) {
            for (const f of page) {
                if (f) result.push(f)
            }
            if (!pager.hasNextPage()) break;
            page = await pager.nextPage();
        }
        return result;
    }

    /**Verifica si el estado de un archivo en Gemini es ACTIVE o PROCESSING */
    async fileIsActiveInGemini(fileGenai: FileGenai): Promise<boolean> {
        const fileName = fileGenai.name;
        let fileState = ((await this.getFile(fileName as string)).state);

        let attempts = 0;
        let fileIsActive = fileState === 'ACTIVE';
        while (fileState !== 'ACTIVE' && attempts < this.MAX_ATTEMPTS) {
            attempts++;

            switch (fileState) {
                case 'PROCESSING':
                    this.logger.debug(`PROCESSING file ${fileName}. Attempt ${attempts}/${this.MAX_ATTEMPTS}`);
                    await new Promise(resolve => setTimeout(resolve, this.DELAY_MS));
                    break;
                case 'FAILED':
                    this.logger.error(`NO se pudo procesar el archivo ${fileName} en GEMINI. File state; ${fileState}`);
                    attempts = this.MAX_ATTEMPTS; //terminamos los intentos
                    break;
            }

            fileState = (await this.getFile(fileName as string)).state
            if (fileState === 'ACTIVE') {
                fileIsActive = true;
                this.logger.debug(`File ${fileName} is ACTIVE`);
            }
        }
        return fileIsActive;

    }

    /**Espera a que el archivo en Gemini este en Active. Si es FAILED lanza un error */
    async waitForToBeActiveInGemini(fileGenaiName: string): Promise<void> {

        let fileState = ((await this.getFile(fileGenaiName)).state);
        let attempts = 0;

        while (fileState !== 'ACTIVE' && attempts < this.MAX_ATTEMPTS) {
            attempts++;

            switch (fileState) {
                case 'PROCESSING':
                    this.logger.debug(`PROCESSING file ${fileGenaiName}. Attempt ${attempts}/${this.MAX_ATTEMPTS}`);
                    await new Promise(resolve => setTimeout(resolve, this.DELAY_MS));
                    break;
                case 'FAILED':
                    this.logger.error(`NO se pudo procesar el archivo ${fileGenaiName} en GEMINI. File state; ${fileState}`);
                    const wrappedError = new Error(`NO se pudo procesar el archivo ${fileGenaiName} en GEMINI. File state; ${fileState}`);
                    wrappedError.name = 'STATE_FAILED';
                    throw wrappedError;
            }

            fileState = (await this.getFile(fileGenaiName as string)).state
        }
        if (fileState !== 'ACTIVE') {
            const wrappedError = new Error(`Fallo al esperar a que el archivo en Gemini este listo. Intentos maximos alcanzados para el archivo ${fileGenaiName}`)
            wrappedError.name = 'MAX_ATTEMPTS_FAILED';
            throw wrappedError;
        } else {
            this.logger.debug(`File ${fileGenaiName} is ACTIVE`);
        }
    }

    //Chats

    async simpleChat(message: string, files: FileGenai[] | undefined = undefined): Promise<GenerateContentResponse> {
        let contents
        try {
            if (files) {
                const filesFromUri = files.map((file) => createPartFromUri(file.uri!, file.mimeType!));
                contents = [...filesFromUri, message];
            } else {
                contents = [message];
            }
            const response = await this.ai.models.generateContent({
                model: this.modelName,
                contents
            })
            return response;
        } catch (error) {

            this.logger.error(`Error in 'simpleChat' ->  ${error}`);
            if (error instanceof ApiError) {
                throw error;

            } else {
                const newError = new Error(`Error getting response from Dacuai AI`);
                newError.name = 'GEMINI';
                newError.cause = error;
                throw newError;
            }

        }
    }

    async chatWithFunctionCalling(
        contents: Content[],
        functionDeclarations: FunctionDeclaration[],
        functionCallingMode: FunctionCallingConfigMode, //ANY, AUTO 
        systemInstructions: string | undefined = undefined,
    ): Promise<GenerateContentResponse> {
        //configuraciones con function calling y systemInstructions
        const config: GenerateContentConfig = {
            tools: [{
                functionDeclarations
            }],
            toolConfig: {
                functionCallingConfig: {
                    mode: functionCallingMode
                }
            },
            systemInstruction: systemInstructions

        }

        try {

            const response = await this.ai.models.generateContent({
                model: this.modelName,
                contents,
                config
            })
            return response;
        } catch (error) {
            this.logger.error(`Error in 'chatWithFunctionCalling' ->  ${error}`);
            if (error instanceof ApiError) {
                throw error;

            } else {
                const newError = new Error(`Error getting response from Dacuai AI`);
                newError.name = 'GEMINI';
                newError.cause = error;
                throw newError;
            }

        }

    }

    /**Función para generar un request utilizando un cache */
    async simpleChatWithCacheContent(cache: CachedContent, prompt: string): Promise<GenerateContentResponse> {
        try {
            const response = await this.ai.models.generateContent({
                model: this.modelName,
                contents: prompt,
                config: { cachedContent: cache.name }
            })
            return response;
        } catch (error) {
            this.logger.error(`Error in 'simpleChat' ->  ${error}`);
            if (error instanceof ApiError) {
                throw error;

            } else {
                const newError = new Error(`Error getting response from Dacuai AI`);
                newError.name = 'GEMINI';
                newError.cause = error;
                throw newError;
            }
        }

    }

    //Chats con streaming

    async simpleChatStreaming(
        prompt: string,
        files: FileGenai[] | undefined = undefined
    ): Promise<AsyncGenerator<GenerateContentResponse>> {
        let contents
        try {
            if (files) {
                const filesFromUri = files.map((file) => createPartFromUri(file.uri!, file.mimeType!));
                contents = [...filesFromUri, prompt];
            } else {
                contents = [prompt];
            }
            const response = await this.ai.models.generateContentStream({
                model: this.modelName,
                contents
            })
            return response
        } catch (error) {
            this.logger.error(`Error in 'simpleChatStreaming' ->  ${error}`);
            if (error instanceof ApiError) {
                throw error;

            } else {
                const newError = new Error(`Error getting response from Dacuai AI`);
                newError.name = 'GEMINI';
                newError.cause = error;
                throw newError;
            }
        }
    }

    /**Funcion de prueba solamente */
    async chatPruebaStreaming(message: string): Promise<AsyncGenerator<GenerateContentResponse>> {
        try {
            const response = await this.ai.models.generateContentStream({
                model: this.modelName,
                contents: [message],
                config: {
                    systemInstruction: `Eres un agente de IA cuya función es hacer pasar un rato ameno al usuario. Sin importar cuál sea la pregunta o el mensaje del usuario tu tarea es responder con un chiste pequeño y corto y de vez en cuando haz referencias de la serie de One Piece, . No le busques coherencia a las preguntas del usuario, solo se gracioso y un fan de la serie.`
                }
            })
            return response
        } catch (error) {
            this.logger.error(`Error in 'chatPruebaStreaming' ->  ${error}`);
            if (error instanceof ApiError) {
                throw error;

            } else {
                const newError = new Error(`Error getting response from Dacuai AI`);
                newError.name = 'GEMINI';
                newError.cause = error;
                throw newError;
            }

        }
    }

    //CACHE

    /**Función para crear un cacheContent. Recibe un archivo y un systemInstructions y guarda eso en cache.
     * Mínimo de tokes para guardar cache de Gemini 2.5 pro -> 4,096.
     * Mínimo de tokes para guardar cache de Gemini 2.5 flash -> 1,024.
     */
    async createCacheContent(file: FileGenai, systemInstruction: string, displayName: string) {
        try {
            const cache = await this.ai.caches.create({
                model: this.modelName,
                config: {
                    contents: createUserContent(createPartFromUri(file.uri!, file.mimeType!)),
                    systemInstruction,
                    displayName
                }
            })
            return cache;

        } catch (error) {
            this.logger.error(`Error in 'createCacheContent' -> ${error}`);
            if (error instanceof ApiError) {
                throw error;
            } else {
                const wrappedError = new Error(`Error in createCacheContent `);
                wrappedError.cause = error;
                wrappedError.name = 'CREATE_CACHE';
                throw wrappedError;
            }
        }
    }

    /**FUnción para listar los caches guardados */
    async listCaches(): Promise<string[]> {
        const pager = await this.ai.caches.list({ config: { pageSize: 10 } });
        let result: string[] = [];
        let page = pager.page;
        while (true) {
            for (const c of page) {
                if (c) result.push(c.name!)
            }
            if (!pager.hasNextPage()) break;
            page = await pager.nextPage();
        }
        return result;
    }

    async deleteOneCache(cacheName: string) {
        await this.ai.caches.delete({ name: cacheName });
    }

    async deleteAllCaches() {
        const caches = await this.listCaches();
        for (const cache of caches) {
            await this.ai.caches.delete({ name: cache });
        }
    }



}