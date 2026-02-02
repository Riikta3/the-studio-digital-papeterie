import {
  Calendar,
  Camera,
  Gift,
  Globe,
  Heart,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
  Music,
  Users,
  Utensils,
  Video,
} from "lucide-react";

export const APP_MODULES = [
  {
    id: "rsvp",
    name: "Gestion RSVP",
    icon: Users,
    description: "Confirmations de présence",
  },
  {
    id: "gallery",
    name: "Galerie Photo",
    icon: ImageIcon,
    description: "Partagez vos souvenirs",
  },
  {
    id: "program",
    name: "Programme",
    icon: Calendar,
    description: "Déroulé de la journée",
  },
  {
    id: "travel",
    name: "Infos Voyage",
    icon: Globe,
    description: "Hébergement & transport",
  },
  {
    id: "map",
    name: "Plan Interactif",
    icon: MapPin,
    description: "Localisation des lieux",
  },
  {
    id: "music",
    name: "Playlist",
    icon: Music,
    description: "Suggestions musicales",
  },
  {
    id: "gifts",
    name: "Liste de Mariage",
    icon: Gift,
    description: "Cadeaux & participations",
  },
  {
    id: "video",
    name: "Vidéo d'Intro",
    icon: Video,
    description: "Message vidéo personnalisé",
  },
  {
    id: "messages",
    name: "Livre d'Or",
    icon: MessageSquare,
    description: "Messages des invités",
  },
  { id: "menu", name: "Menu", icon: Utensils, description: "Détails du repas" },
  {
    id: "dress",
    name: "Dress Code",
    icon: Heart,
    description: "Tenue recommandée",
  },
  {
    id: "photos",
    name: "Partage Photos",
    icon: Camera,
    description: "Album collaboratif",
  },
];
