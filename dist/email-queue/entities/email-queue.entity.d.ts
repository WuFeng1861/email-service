export declare enum EmailStatus {
    PENDING = "pending",
    SENT = "sent",
    FAILED = "failed"
}
export declare class EmailQueue {
    id: number;
    app: string;
    recipient: string;
    cc: string;
    bcc: string;
    subject: string;
    content: string;
    contentType: string;
    templateId: number;
    templateData: Record<string, any>;
    emailKeyId: number;
    status: EmailStatus;
    errorMessage: string;
    sentAt: Date;
    retryCount: number;
    createdAt: Date;
    updatedAt: Date;
}
