import crypto from 'crypto';

export const generateJobId = (userId:string) => {
    return crypto
        .createHash('sha256')
        .update(userId)
        .digest('hex');
};