import { FastifyReply, FastifyRequest, FastifyInstance } from 'fastify';


const getDoctors = async (request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance): Promise<void> => {
    try {
        const { data } = await fastify.supabase.from('profile').select().eq('role', 'Doctor');
        return reply.status(200).send({ message: "Doctors retrieved successfull", success: true, data});
    } catch (error) {
        return reply.status(500).send({ message: error });
    }
}

const getDoctor = async (request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance): Promise<void> => {
    const authorizationHeader : any = request.headers['authorization'];
    const decodedToken = fastify.decodedToken(authorizationHeader.slice(7));
    try {
        const { data } = await fastify.supabase
        .from('profile')
        .select(`
        *,
        schedule(*)
        `)
        .eq('email', decodedToken.email)
        .single();
        return reply.status(200).send({ message: "Doctor retrieved successfull", success: true, data});
    } catch (error) {
        return reply.status(500).send({ message: error });
    }
}

const getScheduleDoctor = async (request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance): Promise<void> => {
  try {
    const {doctorId} : any = request.params;
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    const gmt7Date = new Date(Date.now() - tzOffset).toISOString();
    const currentDate = gmt7Date.slice(0, 10);

    const { data :doctor }:any = await fastify.supabase.from('profile').select().eq('id', doctorId).single();
    const { data }:any = await fastify.supabase.from('schedule').select().eq('doctorId', doctorId).eq('date', currentDate).single();

    // Process the 'data' to generate the time slots/buttons (14:00, 14:30, ..., 17:30).
    const availableTimeSlots = await generateTimeSlots(data, reply, fastify);
    return reply.status(200).send({ message: 'Available time slots retrieved successfull', success: true, data: doctor, timeSlot: availableTimeSlots });
  } catch (error) {
    return reply.status(500).send({ message: error, success: false });
  }
} 

const generateTimeSlots = async (scheduleData: any, reply: FastifyReply, fastify: FastifyInstance) => {
    if (!scheduleData || scheduleData.length === 0) {
        return reply.status(404).send({ message: 'No schedule data found for the doctor', success: false });
    }
    const doctorId = scheduleData.doctorId;
    const startTime = new Date(scheduleData.availableFrom);
    const endTime = new Date(scheduleData.availableTo);
    const timeSlots = [];

    const { data: bookedSlotsData }:any = await fastify.supabase.from('bookings').select('timeSlot').eq('doctorId', doctorId);
    
    const convertedData = bookedSlotsData.map((item: any) => {
      const dateTimeString = item.timeSlot;
      const dateObj = new Date(dateTimeString);
      const formattedTime = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
      return { timeSlot: formattedTime };
    });

    const bookedSlotsSet:any = new Set(convertedData.map((booking: any) => booking.timeSlot));

    while (startTime < endTime) {
        const formattedHour = startTime.getHours().toString().padStart(2, '0');
        const formattedMinute = startTime.getMinutes().toString().padStart(2, '0');
        const timeSlot = `${formattedHour}:${formattedMinute}`;

        // Check if the time slot is available and not booked
        const isAvailable = !bookedSlotsSet.has(timeSlot);
        const isBooked = bookedSlotsSet.has(timeSlot);

        timeSlots.push({
            time: timeSlot,
            available: isAvailable,
            booked: isBooked,
        });
        startTime.setMinutes(startTime.getMinutes() + 30); // Move to the next 30-minute slot
    }
    return timeSlots;
};


const scheduleDoctor = async (request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance): Promise<void> => {
    const authorizationHeader : any = request.headers['authorization'];
    const decodedToken = fastify.decodedToken(authorizationHeader.slice(7));
    const body: any = request.body;
    const date = body.availableFrom.slice(0, 10);
    const availableFrom = body.availableFrom.slice(0, 10);
    const availableTo = body.availableTo.slice(0, 10);

    try {
        if(availableFrom !== availableTo) return reply.status(400).send({ message: 'Date not same', success: false });
       
        const { data: id }: any = await fastify.supabase
        .from('profile')
        .select('id')
        .eq('email', decodedToken.email)
        .single();

        const { data: checkDate }: any = await fastify.supabase
        .from('schedule')
        .select('date')
        .eq('doctorId', id.id)
        .eq('date', date)
        .single();
        if(checkDate) return reply.status(400).send({ message: 'Schedule duplicate', success: false });


        const { error }: any = await fastify.supabase
        .from('schedule')
        .insert({
            doctorId: id.id,
            availableFrom: body.availableFrom,
            availableTo: body.availableTo,
            date
        })
        if (error) return reply.status(400).send({ message: error, success: false });
        return reply.status(200).send({
            success: true,
            message: "Schedule doctor successful"
        });
    } catch (error) {
        return reply.status(500).send({ message: error });
    }
  }

  const delSchedule = async (request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance): Promise<void> => {
    const { id }: any = request.params;
  
    try {
        const { error }: any = await fastify.supabase.from('schedule').delete().eq('id', id);
        if (error) return reply.status(400).send({ message: error, success: false });
        return reply.status(200).send({
            success: true,
            message: "Delete schedule successful"
        });
    } catch (error) {
        return reply.status(500).send({ message: error });
    }
  }

export default {
    getDoctors,
    getDoctor,
    getScheduleDoctor,
    scheduleDoctor,
    delSchedule,
}