import type {
    IBinaryData,
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';
import { BINARY_ENCODING } from 'n8n-workflow';
import mammoth from 'mammoth';
import { getFileType } from './GenericFunctions';

export class DocxExtract implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'DOCX Extract',
        name: 'docxExtract',
        icon: 'file:docx.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"]}}',
        description: 'Extract text from DOCX files',
        defaults: {
            name: 'DOCX Extract',
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Binary Property',
                name: 'binaryPropertyName',
                type: 'string',
                default: 'data',
                required: true,
                description: 'Name of the binary property containing the DOCX file',
            },
            {
                displayName: 'Output Format',
                name: 'outputFormat',
                type: 'options',
                default: 'text',
                options: [
                    {
                        name: 'Text Only',
                        value: 'text',
                    },
                    {
                        name: 'HTML',
                        value: 'html',
                    },
                ],
                description: 'Format of the extracted content',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
            const outputFormat = this.getNodeParameter('outputFormat', i) as string;

            try {
                const binaryData = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                const fileType = getFileType(items[i].binary![binaryPropertyName] as IBinaryData);

                if (!['docx', 'doc', 'document'].includes(fileType.toLowerCase())) {
                    throw new Error(`File type ${fileType} is not supported. Only DOCX files are supported.`);
                }

                let result;
                if (outputFormat === 'html') {
                    result = await mammoth.convertToHtml({ buffer: binaryData });
                } else {
                    result = await mammoth.extractRawText({ buffer: binaryData });
                }

                // Create binary data for the extracted content
                const binaryOutput = await this.helpers.prepareBinaryData(
                    Buffer.from(result.value),
                    items[i].binary![binaryPropertyName].fileName || 'extracted.txt',
                    outputFormat === 'html' ? 'text/html' : 'text/plain',
                );

                returnData.push({
                    json: {
                        extractedContent: result.value,
                        messages: result.messages,
                        success: true,
                    },
                    binary: {
                        [binaryPropertyName + '_extracted']: binaryOutput,
                    },
                    pairedItem: { item: i },
                });
            } catch (error) {
                returnData.push({
                    json: {
                        error: error.message,
                        success: false,
                    },
                    pairedItem: { item: i },
                });
            }
        }

        return [returnData];
    }
}