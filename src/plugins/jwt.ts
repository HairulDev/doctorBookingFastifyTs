import fp from 'fastify-plugin'

import * as jwt from 'jsonwebtoken';
// import jwt from 'fastify-jwt';

import env from '../configs/vars'

const jwtSecret: any = env.jwtSecret;
const oneDay = 86400;

export interface SupportPluginOptions {
  // Specify Support plugin options here
}

export default fp(async (fastify, opts) => {
  fastify.decorate('jwtSign', (data: any) => jwt.sign(data, jwtSecret, { expiresIn: oneDay }));

  fastify.decorate('decodedToken', (token: string) => {
    try {
      return jwt.decode(token);
    } catch (err) {
      return null;
    }
  });
})

declare module 'fastify' {
  export interface FastifyInstance {
    jwtSign: (data: any) => string;
    decodedToken: (token: string) => any | null;
  }
}