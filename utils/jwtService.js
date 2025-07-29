import jwt from 'jsonwebtoken';


class JwtService {
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