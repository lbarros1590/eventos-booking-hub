export const BUSINESS_INFO = {
  name: 'EJ Eventos',
  address: 'R. dos Cravos, 174 - Serra Dourada, Cuiabá - MT, 78056-239',
  phones: ['65 99286 0607', '65 99904 1276'],
  contactPerson: 'Leiner',
  instagram: '@ejeventoscba',
  whatsappNumber: '5565992860607',
  whatsappMessage: 'Olá! Gostaria de saber mais sobre o espaço para eventos.',
};

export const AMENITIES = [
  { id: 1, name: 'Piscina Adulto', icon: 'Waves' },
  { id: 2, name: 'Piscina Infantil', icon: 'Baby' },
  { id: 3, name: 'Churrasqueira', icon: 'Flame' },
  { id: 4, name: 'Suíte com Ar', icon: 'Wind' },
  { id: 5, name: 'Área Coberta Grande', icon: 'Home' },
  { id: 6, name: 'Área ao Ar Livre', icon: 'Sun' },
  { id: 7, name: 'Freezer Grande', icon: 'Snowflake' },
  { id: 8, name: 'Mesa Inox Grande', icon: 'Square' },
  { id: 9, name: 'Fogão Industrial', icon: 'ChefHat' },
  { id: 10, name: '25 Cadeiras Brancas', icon: 'Armchair' },
  { id: 11, name: '7 Mesas Brancas', icon: 'Table' },
  { id: 12, name: 'Ventiladores', icon: 'Fan' },
  { id: 13, name: 'Wi-Fi Grátis', icon: 'Wifi' },
];

export const PRICING = {
  weekday: {
    label: 'Segunda a Quinta',
    price: 400,
  },
  weekend: {
    label: 'Sexta a Domingo',
    price: 600,
  },
  cleaningFee: 70,
  partyDuration: 12, // hours
};

export const LOYALTY_THRESHOLD = 4; // reservations needed for discount
export const LOYALTY_DISCOUNT = 0.2; // 20% discount
