// Static catalogue. Prices in whole dollars per day.
const img = id => `https://images.unsplash.com/${id}?w=900&q=80&fm=jpg&fit=crop`;

export const BIKES = [
  { id: 'coast-cruiser', name: 'Coast Cruiser', type: 'cruiser', pricePerDay: 28, description: 'Upright and easy. The one for the Rec Trail to Lovers Point and back.', specs: 'Single speed · Coaster brake · Front basket', image: img('photo-1507035895480-2b3156c31fc8') },
  { id: 'bayline-hybrid', name: 'Bayline Hybrid', type: 'hybrid', pricePerDay: 34, description: 'Light frame, flat bars, enough gears for the hills behind Pacific Grove.', specs: '21 speed · Disc brakes · Rack mounts', image: img('photo-1571068316344-75bc76f77890') },
  { id: 'road-carbon', name: 'Pacific Road', type: 'road', pricePerDay: 55, description: 'Carbon frame and 28 mm tires for the 17-Mile Drive and Highway 1 to Big Sur.', specs: 'Carbon · 2×11 · Clipless or flat pedals', image: img('photo-1576435728678-68d0fbf94e91') },
  { id: 'ridge-hardtail', name: 'Ridge Hardtail', type: 'mountain', pricePerDay: 48, description: 'Fort Ord has 80 miles of singletrack. This is the bike for it.', specs: '29" · 120 mm fork · 1×12 · Dropper post', image: img('photo-1544191696-102dbdaeeaa0') },
  { id: 'volt-cruiser', name: 'Volt E-Cruiser', type: 'electric', pricePerDay: 62, description: 'Pedal assist up to 20 mph and a 50-mile range. Hills stop being a question.', specs: '500 W mid-drive · 50 mi range · Integrated lights', image: img('photo-1571333250630-f0230c320b6d') },
  { id: 'gravel-rover', name: 'Gravel Rover', type: 'gravel', pricePerDay: 52, description: 'Fire roads, dirt, and the long way home. Comes with frame bags if you ask.', specs: '45 mm tires · 1×11 · Bar bag included', image: img('photo-1511994298241-608e28f14fde') },
];

export const PICKUP_ADDRESS = '412 Cannery Row, Monterey, CA 93940';
