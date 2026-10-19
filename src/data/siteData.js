export const RESTAURANT = {
  name: 'Aurelia',
  tagline: 'Kitchen & Wine',
  address: '24 Marigold Lane, Old Town',
  city: 'Springfield, ST 10024',
  phone: '+1 (555) 019-2024',
  email: 'reservations@aurelia-demo.com',
};

// 0 = Sunday ... 6 = Saturday
export const OPENING_HOURS = [
  { day: 0, label: 'Sunday', open: '12:00', close: '21:00', lastSeating: '19:30' },
  { day: 1, label: 'Monday', open: null, close: null, lastSeating: null },
  { day: 2, label: 'Tuesday', open: '17:00', close: '22:30', lastSeating: '21:00' },
  { day: 3, label: 'Wednesday', open: '17:00', close: '22:30', lastSeating: '21:00' },
  { day: 4, label: 'Thursday', open: '17:00', close: '22:30', lastSeating: '21:00' },
  { day: 5, label: 'Friday', open: '12:00', close: '23:00', lastSeating: '21:30' },
  { day: 6, label: 'Saturday', open: '12:00', close: '23:00', lastSeating: '21:30' },
];

export const HOURS_SUMMARY = [
  { days: 'Monday', hours: 'Closed' },
  { days: 'Tuesday – Thursday', hours: '5:00 PM – 10:30 PM' },
  { days: 'Friday – Saturday', hours: '12:00 PM – 11:00 PM' },
  { days: 'Sunday', hours: '12:00 PM – 9:00 PM' },
];

export const TESTIMONIALS = [
  {
    name: 'Margot L.',
    occasion: 'Anniversary dinner',
    quote:
      'An evening that felt unhurried and entirely considered. The ribeye was perfect and the staff remembered our anniversary without being asked.',
  },
  {
    name: 'Daniel R.',
    occasion: 'Business dinner',
    quote:
      'We hosted a table of eight in the private room. Impeccable service, a superb wine pairing and not once did we feel rushed.',
  },
  {
    name: 'Priya S.',
    occasion: 'Birthday celebration',
    quote:
      'The terrace at dusk is something special. Every course arrived like a small surprise, and the chocolate fondant was unforgettable.',
  },
];

export const FAQS = [
  { q: 'How far in advance can I book?', a: 'Tables can be reserved up to 60 days ahead and up to one hour before service.' },
  { q: 'Can I cancel my reservation?', a: 'Yes. You can cancel from your dashboard at any time up to 4 hours before your booking.' },
  { q: 'Do you cater for allergies?', a: 'Absolutely. Please add dietary requirements to your booking and our team will prepare accordingly.' },
];
