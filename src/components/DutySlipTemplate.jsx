import React, { forwardRef } from 'react';

const DutySlipTemplate = forwardRef(({ booking, config, plans, formatDate }, ref) => {
  if (!booking) return null;

  const plan = plans?.find((p) => p.id === booking.plan_id);
  const planName = plan ? plan.plan_name : 'N/A';

  const getPassengers = () => {
    if (!booking.passenger_details || booking.passenger_details.length === 0) return 'N/A';
    if (config?.addAllPassengerNames) {
      return booking.passenger_details
        .map((p) => `${p.name || ''} - ${p.phone || ''}`)
        .join(', ');
    }
    const p1 = booking.passenger_details[0];
    return `${p1.name || ''} - ${p1.phone || ''}`;
  };

  const getDates = () => {
    const journey = formatDate ? formatDate(booking.journey_date) : booking.journey_date;
    const returnDate = booking.return_date && formatDate ? formatDate(booking.return_date) : booking.return_date;
    if (config?.addEntireDateRange && returnDate) {
      return `${journey} to ${returnDate}`;
    }
    return journey;
  };

  // Default values from booking
  const customerName = config?.addCustomerName ? booking.customer_name : '';
  const bookedBy = config?.addBookedByName ? booking.booked_by_name : '';

  return (
    <div ref={ref} className="bg-white text-black p-8 font-sans" style={{ width: '800px', minHeight: '1120px' }}>

      {!config?.hideBusinessLetterHead && (
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-widest">PURVI TRAVELS</h1>
          <p className="text-sm">Premium Car Rental Services</p>
        </div>
      )}

      <div className="border-y-2 border-black py-1 text-center font-bold text-lg tracking-[0.2em] uppercase mb-6">
        DUTY SLIP
      </div>

      <div className="grid grid-cols-2 gap-x-12 gap-y-10 text-[12px] font-semibold mb-10">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[120px_1fr]"><span className="text-gray-900">Customer:</span> <span>{customerName}</span></div>
          {bookedBy && <div className="grid grid-cols-[120px_1fr]"><span className="text-gray-900">Booked By:</span> <span>{bookedBy}</span></div>}
          <div className="grid grid-cols-[120px_1fr]"><span className="text-gray-900">Passenger:</span> <span>{getPassengers()}</span></div>
          <div className="grid grid-cols-[120px_1fr]"><span className="text-gray-900">Date:</span> <span>{getDates()}</span></div>
          <div className="grid grid-cols-[120px_1fr]"><span className="text-gray-900">Reporting Time:</span> <span>{booking.pickup_time || ''}</span></div>
          {config?.addGarageStartTime && (
            <div className="grid grid-cols-[120px_1fr]"><span className="text-gray-900">Garage Start:</span> <span></span></div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[130px_1fr]"><span className="text-gray-900">Booking Id:</span> <span>#{booking.booking_id}</span></div>
          {!config?.hideDutyTypeName && (
            <div className="grid grid-cols-[130px_1fr]"><span className="text-gray-900">Duty Type:</span> <span>{planName}</span></div>
          )}
          {!config?.hideVehicleGroupName && (
            <div className="grid grid-cols-[130px_1fr]"><span className="text-gray-900">Vehicle Group:</span> <span>{booking.vehicle_type || ''}</span></div>
          )}
          {!config?.hideVehicleName && (
            <div className="grid grid-cols-[130px_1fr]"><span className="text-gray-900">Vehicle:</span> <span>{booking.vehicle_number || ''}</span></div>
          )}
          <div className="grid grid-cols-[130px_1fr]"><span className="text-gray-900">Driver:</span> <span>{booking.driver_name || ''}</span></div>
        </div>
      </div>

      {/* Main Table 1 */}
      <table className="w-full border-collapse border-2 border-black text-[11px] mb-6 text-center">
        <thead>
          <tr className='p-3'>
            <th className="border border-black p-3 align-middle" rowSpan={2}>Reporting Date</th>
            <th className="border border-black p-3" colSpan={2}>Start</th>
            <th className="border border-black p-3" colSpan={2}>End</th>
            <th className="border border-black p-3" colSpan={2}>Total</th>
            <th className="border border-black p-3" colSpan={2}>Extra</th>
            <th className="border border-black p-3 align-middle" rowSpan={2}>Signature</th>
          </tr>
          <tr className='p-3'>
            <th className="border border-black p-3 font-normal">Kilometers</th>
            <th className="border border-black p-3 font-normal">Time</th>
            <th className="border border-black p-3 font-normal">Kilometers</th>
            <th className="border border-black p-3 font-normal">Time</th>
            <th className="border border-black p-3 font-normal">Kilometers</th>
            <th className="border border-black p-3 font-normal">Time</th>
            <th className="border border-black p-3 font-normal">Kilometers</th>
            <th className="border border-black p-3 font-normal">Time</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: '40px' }} >
            <td className="border border-black px-2 py-2 font-bold">{getDates()}</td>
            <td className="border border-black px-2 py-2"></td>
            <td className="border border-black px-2 py-2"></td>
            <td className="border border-black px-2 py-2"></td>
            <td className="border border-black px-2 py-2"></td>
            <td className="border border-black px-2 py-2"></td>
            <td className="border border-black px-2 py-2"></td>
            <td className="border border-black px-2 py-2"></td>
            <td className="border border-black px-2 py-2"></td>
            <td className="border border-black px-2 py-2"></td>
          </tr>
          <tr style={{ height: '40px' }}>
            <td className="border border-black px-3 py-2"></td>
            <td className="border border-black px-3 py-2"></td>
            <td className="border border-black px-3 py-2"></td>
            <td className="border border-black px-3 py-2"></td>
            <td className="border border-black px-3 py-2"></td>
            <td className="border border-black px-3 py-2"></td>
            <td className="border border-black px-3 py-2"></td>
            <td className="border border-black px-3 py-2"></td>
            <td className="border border-black px-3 py-2"></td>
            <td className="border border-black px-3 py-2"></td>
          </tr>
        </tbody>
      </table>

      {/* Table 2: Items */}
      <table className="w-full border-collapse border border-black text-[11px] font-bold mb-6">
        <thead>
          <tr className="border-b border-black p-3">
            <th className="p-3 border-r border-black w-2/3">Item</th>
            <th className="p-3 w-1/3">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-black p-3" style={{ height: '40px' }}>
            <td className="px-3 py-2 border-r border-black font-normal">Toll & Parking (T)</td>
            <td className="px-3 py-2"></td>
          </tr>
          <tr style={{ height: '40px' }} className='p-3'>
            <td className="px-3 py-2 border-r border-black font-normal">Toll & Parking</td>
            <td className="px-3 py-2"></td>
          </tr>
        </tbody>
      </table>

      {/* Table 3: Customer Entered */}
      {config?.addReleasedKmTime && (
        <table className="w-full border-collapse border border-black text-[11px] font-bold mb-6 text-left">
          <thead>
            <tr className="border-b border-black text-center bg-gray-50 text-black p-3">
              <th className="p-3" colSpan={5}>[To be entered by customer]</th>
            </tr>
            <tr className="border-b border-black p-3">
              <th className="p-3 border-r border-black w-1/4">Date</th>
              <th className="p-3 border-r border-black">Reporting KM</th>
              <th className="p-3 border-r border-black">Reporting Time</th>
              <th className="p-3 border-r border-black">Released KM</th>
              <th className="p-3">Released Time</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black p-3" style={{ height: '40px' }}>
              <td className="px-3 py-2 border-r border-black">{getDates()}</td>
              <td className="px-3 py-2 border-r border-black"></td>
              <td className="px-3 py-2 border-r border-black"></td>
              <td className="px-3 py-2 border-r border-black"></td>
              <td className="px-3 py-2"></td>
            </tr>
            <tr style={{ height: '40px' }} className='p-3'>
              <td className="px-3 py-2 border-r border-black"></td>
              <td className="px-3 py-2 border-r border-black"></td>
              <td className="px-3 py-2 border-r border-black"></td>
              <td className="px-3 py-2 border-r border-black"></td>
              <td className="px-3 py-2"></td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Feedback & Footer Table */}
      <table className="w-full border-collapse border border-black text-[11px] font-bold text-left">
        <tbody>
          <tr className="border-b border-black">
            <td className="p-3" colSpan={2}>
              Feedback: <span className="font-normal">Very Poor / Poor / Good / Very Good / Excellent</span>
            </td>
          </tr>
          <tr className="border-b border-black align-top" style={{ height: '120px' }}>
            <td className="p-3 border-r border-black w-1/2">
              Remarks:
              {!config?.hideRemarks && booking.remarks && (
                <div className="font-bold text-blue-800 text-[12px] mt-2">{booking.remarks}</div>
              )}
            </td>
            <td className="p-3 w-1/2">Signature</td>
          </tr>
          <tr className="border-b border-black align-top" style={{ height: '90px' }}>
            <td className="p-3" colSpan={2}>Instructions for next day use:</td>
          </tr>
          <tr className="align-top" style={{ height: '90px' }}>
            <td className="p-3" colSpan={2}>
              Route:
              <span className="font-bold text-blue-800 text-[12px] block mt-1">
                {booking.pickup_location} {booking.drop_location ? `- ${booking.drop_location}` : ''}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  );
});

DutySlipTemplate.displayName = 'DutySlipTemplate';

export default DutySlipTemplate;
