import jwt from 'jsonwebtoken';
import { loadEnv } from '../config/envConfig.js';
loadEnv()


class JwtService {
    // set expiry to 30m by default
    // todo: implement refresh token also here.
    static sign(
        payload,
        expiry = '30d',
        secret = process.env.ACCESS_TOKEN_KEY
    ) {
        const token = jwt.sign(payload, secret, { expiresIn: expiry });
        return token;
       
    }

    static verify(token, secret = process.env.ACCESS_TOKEN_KEY) {
        return jwt.verify(token, secret)
    }
}

export default JwtService;