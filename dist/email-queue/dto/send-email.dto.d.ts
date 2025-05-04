export declare class RecipientDto {
    email: string;
    name?: string;
}
export declare class SendEmailDto {
    app: string;
    templateId: number;
    templateData: Record<string, any>;
    recipient: string;
    recipientName?: string;
    cc?: RecipientDto[];
    bcc?: RecipientDto[];
}
