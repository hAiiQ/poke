import { Box, Radio, Swords, UserRound } from "lucide-react";

export const statItems = [
  {
    key: "online",
    label: "Online",
    icon: Radio,
    tone: "cyan",
  },
  {
    key: "registered",
    label: "Registriert",
    icon: UserRound,
    tone: "pink",
  },
  {
    key: "casesOpened",
    label: "Kisten geöffnet",
    icon: Box,
    tone: "red",
  },
  {
    key: "battlesPlayed",
    label: "Battles",
    icon: Swords,
    tone: "blue",
  },
];
