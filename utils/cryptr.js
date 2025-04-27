import Cryptr from 'cryptr';

const cryptr = new Cryptr('kinsgter');

// Function to encrypt data
export const encryptData = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const encrypted = cryptr.encrypt(data);
            resolve(encrypted);
        } catch (err) {
            reject(err);
        }
    });
};



export const decryptData = async (encryptedData) => {
    try {

        console.log(encryptData,"eddata");
        
        if (!encryptedData) {
            throw new Error("No data provided for decryption");
        }
        const decrypted = cryptr.decrypt(encryptedData);
        return decrypted;
    } catch (err) {
        throw new Error(`Failed to decrypt data: ${err.message}`);
    }
};
