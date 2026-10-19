// ---------------------------------------------------------------
// All temporary photos live here. To replace one, change its ID
// below, or swap the helper to return a local path such as
// `/images/hero.jpg` (put the file in public/images/).
// ---------------------------------------------------------------
const PHOTO_IDS = {
  // Restaurant & ambience
  hero: 'photo-1517248135467-4c7edcad34c4',
  diningRoom: 'photo-1555396273-367ea4eb4db5',
  barLounge: 'photo-1559339352-11d035aa65de',
  tableSetting: 'photo-1414235077428-338989a2e8c0',
  chefPlating: 'photo-1551218808-94e220e084d2',
  terrace: 'photo-1424847651672-bf20a4b0982b',
  cosy: 'photo-1466978913421-dad2ebd01d17',
  warmInterior: 'photo-1550966871-3ed3cdb5ed0c',
  // Food & drink
  steak: 'photo-1544025162-d76694265947',
  lamb: 'photo-1600891964092-4316c288032e',
  pasta: 'photo-1473093295043-cdd812d0e601',
  salad: 'photo-1546069901-ba9599a7e63c',
  flatlay: 'photo-1498837167922-ddd27525d352',
  plated: 'photo-1504674900247-0877df9cc836',
  starter: 'photo-1476224203421-9ac39bcb3327',
  toast: 'photo-1482049016688-2d3e1b311543',
  chocolate: 'photo-1578985545062-69928b1d9587',
  dessert: 'photo-1565958011703-44f9829ba187',
  wine: 'photo-1510812431401-41d2bd2722f3',
  cocktail: 'photo-1470337458703-46ad1756a187',
};

export function img(key, width = 1200) {
  const id = PHOTO_IDS[key] || PHOTO_IDS.hero;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
}

export const galleryPhotos = [
  { key: 'diningRoom', caption: 'The main dining room', category: 'Interior' },
  { key: 'steak', caption: 'Dry-aged ribeye', category: 'Food' },
  { key: 'barLounge', caption: 'The bar & lounge', category: 'Interior' },
  { key: 'dessert', caption: 'Panna cotta, seasonal berries', category: 'Food' },
  { key: 'terrace', caption: 'Evening on the terrace', category: 'Interior' },
  { key: 'pasta', caption: 'Truffle tagliolini', category: 'Food' },
  { key: 'tableSetting', caption: 'Table set for dinner', category: 'Dining' },
  { key: 'cocktail', caption: 'Aurelia Spritz', category: 'Drinks' },
  { key: 'chefPlating', caption: 'Chef plating at the pass', category: 'Dining' },
  { key: 'chocolate', caption: 'Dark chocolate fondant', category: 'Food' },
  { key: 'cosy', caption: 'A quiet corner table', category: 'Interior' },
  { key: 'wine', caption: 'Sommelier selection', category: 'Drinks' },
];
