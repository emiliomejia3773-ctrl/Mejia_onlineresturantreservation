import { img } from './images';

// What each table looks like from the seat. Add a new table here with a photo key from images.js and a short
// description of the view; any table without an entry falls back to its seating area's photo.
const TABLE_VIEWS = {
  T1: { photo: 'cosy', view: 'Quiet corner for two, tucked beside the window.' },
  T2: { photo: 'tableSetting', view: 'Intimate table for two with a view across the dining room.' },
  T3: { photo: 'diningRoom', view: 'Central table with the whole candlelit room in front of you.' },
  T4: { photo: 'warmInterior', view: 'Banquette seating under warm pendant lights.' },
  T5: { photo: 'tableSetting', view: 'Set for dinner near the entrance, easy for a lively group.' },
  T6: { photo: 'diningRoom', view: 'Round table for six in the heart of the main room.' },
  T7: { photo: 'cosy', view: 'Window table overlooking the street.' },
  P1: { photo: 'terrace', view: 'Garden-side seat with the terrace lanterns overhead.' },
  P2: { photo: 'terrace', view: 'Long terrace table with an open view of the garden.' },
  P3: { photo: 'terrace', view: 'Corner of the terrace, shaded and private.' },
  C1: { photo: 'chefPlating', view: 'Front-row seat watching the chefs plate at the pass.' },
  C2: { photo: 'barLounge', view: 'Counter seat beside the bar and wine display.' },
  C4: { photo: 'chefPlating', view: 'Counter seat with a straight view of the kitchen.' },
  V1: { photo: 'warmInterior', view: 'Your own private room with a long table and a door that closes.' },
};

const AREA_FALLBACK = { indoor: 'diningRoom', terrace: 'terrace', bar: 'barLounge', private: 'warmInterior' };

/** { photo (URL), view (text) } for a table returned by the API ({ code, area, seats }). */
export function tableView(table, width = 700) {
  const v = TABLE_VIEWS[table.code];
  return {
    photo: img(v?.photo || AREA_FALLBACK[table.area] || 'hero', width),
    view: v?.view || 'A comfortable table with a view of the room.',
  };
}
