import { promptLegalPdfExpLegalSummarize } from "../prompts/legalSection/pdfExpLegalSummarize.prompt";
import { promptLegalVideoSummarize } from "../prompts/legalSection/videoSummarize.prompt";
import { promptLegalVideoTranscribe } from "../prompts/legalSection/videoTrascribe.prompt";

// For Videos
export const validVideoInstructions = {
    //Legal section
    'legalVideoSummarize': promptLegalVideoSummarize,
    'legalVideoTranscribe': promptLegalVideoTranscribe,
}

//For PDF
export const validPdfInstructions = {
    //legalSection
    'legalPdfExpLegalSummarize': promptLegalPdfExpLegalSummarize
}