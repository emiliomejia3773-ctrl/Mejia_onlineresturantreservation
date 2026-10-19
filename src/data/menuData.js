export const MENU_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'starters', label: 'Starters' },
  { id: 'mains', label: 'Main Courses' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'drinks', label: 'Drinks' },
];

// `image` is a key from src/data/images.js
export const MENU_ITEMS = [
  { id: 1, category: 'starters', name: 'Burrata & Heirloom Tomato', description: 'Creamy burrata, vine tomatoes, basil oil, aged balsamic and toasted pine nuts.', price: 16, image: 'salad', featured: false },
  { id: 2, category: 'starters', name: 'Seared Scallops', description: 'Hand-dived scallops, cauliflower purée, golden raisin and brown butter.', price: 22, image: 'starter', featured: true },
  { id: 3, category: 'starters', name: 'Wild Mushroom Velouté', description: 'Silken forest mushroom soup, truffle cream and charred sourdough.', price: 14, image: 'toast', featured: false },
  { id: 4, category: 'starters', name: 'Hand-Cut Beef Tartare', description: 'Dry-aged beef, cured yolk, capers, shallot and rye crisps.', price: 19, image: 'flatlay', featured: false },

  { id: 5, category: 'mains', name: 'Dry-Aged Ribeye', description: '35-day aged ribeye, bone-marrow butter, roasted shallots and pommes purée.', price: 48, image: 'steak', featured: true },
  { id: 6, category: 'mains', name: 'Truffle Tagliolini', description: 'Fresh egg pasta, black truffle, parmesan cream and cracked pepper.', price: 32, image: 'pasta', featured: true },
  { id: 7, category: 'mains', name: 'Herb-Crusted Lamb Rack', description: 'Rosemary crust, smoked aubergine, charred leeks and red-wine jus.', price: 44, image: 'lamb', featured: false },
  { id: 8, category: 'mains', name: 'Miso-Glazed Sea Bass', description: 'Line-caught sea bass, bok choy, ginger broth and sesame.', price: 38, image: 'plated', featured: false },
  { id: 9, category: 'mains', name: 'Wild Mushroom Risotto', description: 'Carnaroli rice, porcini, thyme, aged parmesan and truffle oil.', price: 28, image: 'flatlay', featured: false },

  { id: 10, category: 'desserts', name: 'Dark Chocolate Fondant', description: 'Molten Valrhona centre, salted caramel and vanilla bean ice cream.', price: 15, image: 'chocolate', featured: true },
  { id: 11, category: 'desserts', name: 'Vanilla Bean Panna Cotta', description: 'Tahitian vanilla, macerated seasonal berries and shortbread crumb.', price: 13, image: 'dessert', featured: false },
  { id: 12, category: 'desserts', name: 'Burnt Basque Cheesecake', description: 'Caramelised top, creamy centre, poached figs and honey.', price: 14, image: 'dessert', featured: false },

  { id: 13, category: 'drinks', name: 'Aurelia Spritz', description: 'House bitter aperitivo, prosecco, orange and a sprig of rosemary.', price: 14, image: 'cocktail', featured: false },
  { id: 14, category: 'drinks', name: 'Smoked Old Fashioned', description: 'Bourbon, demerara, orange bitters, finished under cedar smoke.', price: 17, image: 'cocktail', featured: false },
  { id: 15, category: 'drinks', name: "Sommelier's Pour", description: 'A rotating glass chosen by our sommelier to match tonight’s menu.', price: 18, image: 'wine', featured: false },
  { id: 16, category: 'drinks', name: 'Sparkling Elderflower', description: 'Non-alcoholic: elderflower, lemon, cucumber and sparkling water.', price: 8, image: 'cocktail', featured: false },
];
