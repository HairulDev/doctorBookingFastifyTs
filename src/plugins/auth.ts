import fp from 'fastify-plugin'

export default fp(async (fastify, opts) => {
    // Add an onRequest hook to verify the user's authentication status
    fastify.addHook('onRequest', async (request, reply) => {
        // Menyebutkan path/route yang ingin diabaikan dari hook
        const publicRoutes = ['/', '/user/login', '/user/register', '/user/register/doctor'];

        let token = request.headers["x-access-token"] || request.headers["authorization"];
        let currentUrl = request.url;
        const currentTimeInSeconds = Math.floor(Date.now() / 1000);

        if (publicRoutes.includes(currentUrl)) {
            return true;
        } else {
            if (!token) {
                return reply.status(401).send({ 
                    message: 'Unauthorized', 
                    success: false 
                });
            }
            if (typeof token === 'string' && token.startsWith("Bearer ")) {
                token = token.slice(7);
                try {
                    const decodedToken = await fastify.decodedToken(token);
                    if (decodedToken.exp < currentTimeInSeconds) {
                        return reply.status(401).send({ 
                            message: 'Token is expired',
                            success: false });
                        }
                } catch (err: any) {
                    return reply.status(401).send({ 
                        message: err, 
                        success: false });
                }
            } else {
                return reply.status(401).send({
                    message: "Authentication token is not supplied.",
                    success: false
                });
            }
        }
    });

});
