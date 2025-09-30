import { FunctionDeclaration, Type } from "@google/genai";

export const answerQuestionAboutVideoFunctionDeclaration: FunctionDeclaration = {
    name: 'answerQuestionAboutVideo',
    description: 'Analiza un video con IA para encontrar información de la respuesta a la pregunta de un usuario sobre el video.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            videoId: {
                type: Type.STRING,
                description: 'El id del video sobre el que se hizo la pregunta'
            },
            question: {
                type: Type.STRING,
                description: 'La pregunta que se debe responder sobre el video'
            }
        }
    }

}