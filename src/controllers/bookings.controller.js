import { createBookingSchema } from "../validators/bookings.validator.js";
import { createBooking } from "../services/bookings.service.js";

export const createBookingController = async (req, res, next) => {
  try {
    const data = createBookingSchema.parse(req.body);
    const booking = await createBooking(data, req.user.id);
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};