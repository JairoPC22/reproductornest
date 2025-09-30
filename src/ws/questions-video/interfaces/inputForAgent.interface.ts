/**Esta es la interface que modela el JSON que debe recibir el agentIA.
 * Si se modifica, se deben modificar las instrucciones del agente para hacer que 
 * coincida, es decir, se debe modificar 'systemInstructionQuestionsAboutVideo'
 */
export interface InputForAgentIA {
    videoName: string;
    videoId: string;
    question: string;
}