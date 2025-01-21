import { IBinaryData, IDataObject } from 'n8n-workflow';

export type BinaryData = IBinaryData & { fileType?: string };
export type JsonData = IDataObject & { fileType?: string };

export function getFileType(binaryData: BinaryData): string {
    if (binaryData.fileType) {
        return binaryData.fileType;
    }
    if (binaryData.mimeType) {
        return binaryData.mimeType.split('/')[1];
    }
    return 'unknown';
}