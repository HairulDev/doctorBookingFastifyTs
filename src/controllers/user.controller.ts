
import { FastifyReply, FastifyRequest, FastifyInstance } from 'fastify';

import isEmpty from "../configs/string";

async function registerHandler(request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance) {
    const { name,  email, password }: any = request.body;
    try {
        if (!name || !email || !password) return reply.status(400).send({ message: "Complete all fields"});

        const { data } = await fastify.supabase
        .from('profile')
        .select()
        .eq('email', email);
        if (!isEmpty(data)) return reply.status(400).send({ message: 'User has registered' });

        const { data: dataSignup, error: errorSignup } = await fastify.supabase.auth.signUp({
            email: email,
            password: password,
          })
        if (errorSignup) return reply.status(400).send({ message: errorSignup?.message, status: false});

        const result = { name, email, users_id: dataSignup?.user?.id, role: "User" };
        await fastify.supabase.from('profile').insert(result);
        return reply.status(200).send({ message: "Your registration is successful", status: true});
    } catch (error) {
        return reply.status(500).send({ message: error,  status: false });
    }
}


async function loginHandler(request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance) {
    const { email, password }: any = request.body;
    try {
        const { data, error } = await fastify.supabase.auth.signInWithPassword({
            email,
            password
          })
        if (error) return reply.status(401).send({ message: error?.message, status: false});
        return reply.status(200).send({ message: "Login successfully", status: true, data});
    } catch (error) {
        return reply.status(500).send({ message: error });
    }
}

async function registerDoctor(request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance) {
    const { name, speciality, price, email, password }: any = request.body;
    try {
        if (!name || !speciality || !price || !email || !password) return reply.status(400).send({ message: "Complete all fields"});

        const { data } = await fastify.supabase.from('profile').select().eq('email', email);
        if (!isEmpty(data)) return reply.status(401).send({ message: 'User has registered' });

        const { data: dataSignup, error: errorSignup } = await fastify.supabase.auth.signUp({
            email: email,
            password: password,
          })
        if (errorSignup) return reply.status(401).send({ message: errorSignup?.message, status: false});

        const result = { name, speciality, price, email, users_id: dataSignup?.user?.id, role: 'Doctor' };
        await fastify.supabase.from('profile').insert(result);
        return reply.status(200).send({ message: "Your registration is successful", status: true});
    } catch (error) {
        return reply.status(500).send({ message: error,  status: false });
    }
}

export default { registerHandler, loginHandler, registerDoctor };
