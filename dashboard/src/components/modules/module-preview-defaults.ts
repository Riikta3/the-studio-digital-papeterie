/**
 * Default example configs for locked module previews.
 * These are used to showcase what a module looks like before purchase.
 */

export const MODULE_PREVIEW_DEFAULTS: Record<string, Record<string, unknown>> = {
  "intro-video": {
    title: "Sophie & Antoine",
    subtitle: "Notre histoire en images",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  timeline: {
    title: "Le Grand Jour",
    items: [
      { time: "14h00", label: "Cérémonie civile", description: "Mairie de Paris, 1er arrondissement" },
      { time: "16h00", label: "Cérémonie religieuse", description: "Église Saint-Germain-des-Prés" },
      { time: "18h30", label: "Cocktail", description: "Jardins du Château de Versailles" },
      { time: "20h00", label: "Dîner & Soirée", description: "Grand salon, ouvert jusqu'à l'aube" },
    ],
  },
  "dress-code": {
    title: "Dress Code",
    subtitle: "Tenue de Soirée",
    mode: "global",
    description:
      "Pour que la fête soit belle, nous vous invitons à porter une touche de vert sapin ou de doré. Les femmes en robe longue, les hommes en costume.",
  },
  rsvp: {
    title: "Confirmer votre présence",
    deadline: "2025-05-01",
    allowPlusOne: true,
    maxGuests: 4,
    dietaryOptions: true,
    messageField: true,
  },
  map: {
    title: "Plan & Accès",
    venues: [
      {
        name: "Château de Fontainebleau",
        address: "77300 Fontainebleau, France",
        description: "Lieu de cérémonie et réception",
        lat: 48.4037,
        lng: 2.7018,
      },
    ],
  },
  accommodation: {
    title: "Hébergements",
    description: "Nous avons sélectionné quelques adresses à proximité pour votre confort.",
    hotels: [
      {
        name: "Hôtel de l'Aigle Noir",
        stars: 4,
        address: "27 Place Napoléon Bonaparte, Fontainebleau",
        price: "À partir de 180€/nuit",
        link: "",
      },
      {
        name: "Hôtel Napoléon",
        stars: 3,
        address: "9 Rue Grande, Fontainebleau",
        price: "À partir de 120€/nuit",
        link: "",
      },
    ],
  },
  transport: {
    title: "Transport",
    description: "Plusieurs options s'offrent à vous pour rejoindre le lieu de réception.",
    options: [
      {
        type: "train",
        label: "En train",
        description: "Ligne R depuis Gare de Lyon, 40 min. Gare de Fontainebleau-Avon à 10 min à pied.",
      },
      {
        type: "car",
        label: "En voiture",
        description: "A6 sortie Fontainebleau, parking gratuit sur place.",
      },
      {
        type: "shuttle",
        label: "Navette",
        description: "Navette gratuite depuis la gare toutes les 30 min à partir de 13h30.",
      },
    ],
  },
  menu: {
    title: "Menu",
    subtitle: "Un repas gastronomique",
    courses: [
      {
        label: "Entrée",
        items: ["Foie gras mi-cuit, chutney de figues", "Velouté de butternut, crème de coco"],
      },
      {
        label: "Plat",
        items: ["Filet de bœuf Wellington, sauce Périgueux", "Saint-Jacques poêlées, risotto aux truffes"],
      },
      {
        label: "Dessert",
        items: ["Pièce montée façon Paris-Brest", "Mignardises & café"],
      },
    ],
  },
  gallery: {
    title: "Notre Galerie",
    images: [
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400",
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=400",
    ],
  },
  "gift-list": {
    title: "Liste de Mariage",
    subtitle: "Participez à notre bonheur",
    cagnotte: true,
    cagnotteLabel: "Voyage de noces au Japon",
    cagnotteDescription: "Contribuez à notre lune de miel de rêve à Tokyo et Kyoto.",
    items: [
      { name: "Robot cuiseur Thermomix", price: 1299, link: "" },
      { name: "Cafetière Nespresso", price: 180, link: "" },
      { name: "Parure de draps en lin", price: 220, link: "" },
    ],
  },
  playlist: {
    title: "Playlist",
    subtitle: "Proposez une chanson",
    description: "Suggérez une chanson pour animer notre soirée ! Le DJ s'engage à en jouer un maximum.",
    spotifyPlaylistUrl: "",
    songs: [
      { title: "Perfect", artist: "Ed Sheeran" },
      { title: "Can't Help Falling in Love", artist: "Elvis Presley" },
      { title: "All of Me", artist: "John Legend" },
    ],
  },
  guestbook: {
    title: "Livre d'Or",
    subtitle: "Laissez-nous un message",
  },
  "video-guestbook": {
    title: "Livre d'Or Vidéo",
    subtitle: "Enregistrez votre message",
  },
  faq: {
    title: "FAQ",
    subtitle: "Infos Pratiques",
    questions: [
      {
        id: "q1",
        question: "Y a-t-il un parking sur place ?",
        answer: "Oui, un grand parking gratuit est disponible devant le château.",
      },
      {
        id: "q2",
        question: "Les enfants sont-ils les bienvenus ?",
        answer: "Bien sûr ! Une animation sera prévue pour les enfants pendant la soirée.",
      },
      {
        id: "q3",
        question: "Peut-on prendre des photos pendant la cérémonie ?",
        answer: "Oui, mais nous vous demandons de respecter les indications du photographe et de rester à vos places.",
      },
    ],
  },
};
