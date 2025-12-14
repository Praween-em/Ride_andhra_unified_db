export class CreateRideDto {
  pickupLocation: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLocation: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  fare: number;
}
