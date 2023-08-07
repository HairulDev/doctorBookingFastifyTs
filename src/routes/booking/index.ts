
import { FastifyPluginAsync, } from 'fastify';

import bookingController from '../../controllers/booking.controller';
const { bookingDoctor, getBooking, delBooking, ratingBooking } = bookingController;

const booking: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  
    fastify.get('/', async function (request, reply) {
        return getBooking(request, reply, fastify);
    });

    fastify.delete('/:id', async function (request, reply) {
        return delBooking(request, reply, fastify);
    });

    fastify.post('/:doctorId', async function (request, reply) {
        return bookingDoctor(request, reply, fastify);
    });

    fastify.put('/:id', async function (request, reply) {
        return ratingBooking(request, reply, fastify);
    });
};

export default booking