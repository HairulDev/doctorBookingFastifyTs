
import { FastifyPluginAsync, } from 'fastify';

import doctorController from '../../controllers/doctor.controller';
const { getDoctors, getDoctor, getScheduleDoctor, scheduleDoctor, delSchedule} = doctorController;

const doctor: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        return getDoctors(request, reply, fastify);
    });

    fastify.get('/detail', async function (request, reply) {
        return getDoctor(request, reply, fastify);
    });

    fastify.get('/:doctorId/schedule', async function (request, reply) {
        return getScheduleDoctor(request, reply, fastify);
    });

    fastify.post('/schedule', async function (request, reply) {
        return scheduleDoctor(request, reply, fastify);
    })

    fastify.delete('/schedule/:id', async function (request, reply) {
        return delSchedule(request, reply, fastify);
    })
};

export default doctor