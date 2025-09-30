/**Esta interfaz es para estructurar la salida de la función 'answerQuestionAboutVideo'
 * de la clase 'AgentIaQuestionsVideo'
 */
export interface outputAnswerQuestionAboutVideo {
    nombre_video?: string;
    video_analizado_por_segmentos?: boolean;
    resultado?: resultado[] | string; // string si el video NO fue analizado por sementos y solo se recibe una respuesta
    mensaje_error?: string;
}

interface resultado {
    num_segmento: number;
    resuesta_de_IA: string
}