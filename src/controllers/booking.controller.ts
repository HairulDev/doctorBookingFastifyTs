import { FastifyReply, FastifyRequest, FastifyInstance } from 'fastify';


const bookingDoctor = async (request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance): Promise<void> => {
  try {
    const authorizationHeader : any = request.headers['authorization'];

    const { doctorId }: any = request.params;
    const { timeSlots }: any = request.body;
    const decodedToken = fastify.decodedToken(authorizationHeader.slice(7));

    const checkSlotPromises = timeSlots.map(async (timeslot: string) => {
      const { data } = await fastify.supabase
        .from('bookings')
        .select('timeSlot')
        .eq('timeSlot', timeslot)
        .eq('doctorId', doctorId);
      return data;
    });
    const checkSlotResults = await Promise.all(checkSlotPromises);
    
    // Flatten the array of results to check for duplicate time slots
    const bookedTimeSlots = checkSlotResults.flatMap((data: any) => data.map((booking: any) => booking.timeSlot));
    if (bookedTimeSlots.length > 0) {
      const formattedTimeSlots = bookedTimeSlots.map((timeslot: string) => {
        const timeOnly = timeslot.split("T")[1].slice(0, 5);
        return timeOnly;
      });
      const message = `Time slot has booked at time ${formattedTimeSlots.join(' and ')} please choose another time slot`;
      return reply.status(400).send({ message, success: false });
    }

    const bookingData = timeSlots.map((timeSlot: any) => ({
      doctorId,
      timeSlot,
      bookedBy: decodedToken.email,
      bookedAt: new Date().toISOString(),
    }));

    await fastify.supabase.from('bookings').insert(bookingData);
    return reply.status(200).send({ message: 'Booking successful', success: true });
  } catch (error) {
    return reply.status(500).send({ message: error, success: false });
  }
};

const getBooking = async (request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance): Promise<void> => {
    try {
        const authorizationHeader : any = request.headers['authorization'];
        const decodedToken = fastify.decodedToken(authorizationHeader.slice(7));
        const { data } = await fastify.supabase
        .from('bookings')
        .select(`
        *,
        profile(name, speciality )
        `)
        .eq('bookedBy', decodedToken.email)
        .order('timeSlot', { ascending: false });
        return reply.status(200).send({ message: "Booking retrieved successfull", success: true, data});
    } catch (error) {
        return reply.status(500).send({ message: error });
    }
}


const delBooking = async (request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance): Promise<void> => {
  const { id }: any = request.params;

  try {
      const { error }: any = await fastify.supabase.from('bookings').delete().eq('id', id);
      if (error) return reply.status(400).send({ message: error, success: false });
      return reply.status(200).send({
          success: true,
          message: "Delete booking successful"
      });
  } catch (error) {
      return reply.status(500).send({ message: error });
  }
}

const ratingBooking = async (request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance): Promise<void> => {
  const authorizationHeader : any = request.headers['authorization'];
  const decodedToken = fastify.decodedToken(authorizationHeader.slice(7));
  const { id }: any = request.params;
  const body = request.body;

  try {
      const { error }: any = await fastify.supabase
      .from('bookings')
      .update(body)
      .eq('bookedBy', decodedToken.email)
      .eq('id', id);
      if (error) return reply.status(400).send({ message: error, success: false });
      return reply.status(200).send({
          success: true,
          message: "Rating booking successful"
      });
  } catch (error) {
      return reply.status(500).send({ message: error });
  }
}


export default {
    bookingDoctor,
    getBooking,
    delBooking,
    ratingBooking
}