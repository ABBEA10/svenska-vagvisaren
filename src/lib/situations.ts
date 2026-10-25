import rondell from "@/assets/sit-rondell.jpg";
import overgang from "@/assets/sit-overgangsstalle.jpg";
import alg from "@/assets/sit-alg.jpg";
import hoger from "@/assets/sit-hogerregel.jpg";
import type { SourceKey } from "./sources";

export type Question = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
  image?: string;
  sourceKey?: SourceKey;
  sourceRef?: string;
  signCode?: string;
  reviewedAt?: string;
};

/** Picture-based traffic situations. */
export const SITUATIONS: Question[] = [
  {
    image: rondell,
    category: "Väjningsregler",
    question: "Du kör fram mot rondellen. Vad gäller?",
    options: [
      "Du har väjningsplikt mot fordon som redan kör i rondellen",
      "Högerregeln gäller – fordon i rondellen ska släppa fram dig",
      "Du har företräde eftersom du kommer från en huvudled",
      "Du måste alltid stanna helt innan du kör in",
    ],
    correctIndex: 0,
    explanation: "Väjningspliktsmärket och hajtänderna betyder att du ska lämna företräde åt trafik som redan är i cirkulationsplatsen. Du behöver inte stanna om det är fritt.",
    sourceKey: "trafikforordningen",
    sourceRef: "3 kap. 18 §",
  },
  {
    image: rondell,
    category: "Stadskörning",
    question: "Du ska ta första avfarten till höger. Hur placerar du bilen?",
    options: [
      "Längst till höger och blinkar höger innan du kör in",
      "I innerfilen utan att blinka",
      "Mitt i körbanan och blinkar vänster",
      "Längst till vänster och blinkar höger vid avfarten",
    ],
    correctIndex: 0,
    explanation: "Ska du ta första avfarten håller du till höger och visar tecken höger redan innan du kör in i rondellen.",
    sourceKey: "trafikforordningen",
    sourceRef: "3 kap. 22 §",
  },
  {
    image: overgang,
    category: "Trafiksäkerhet",
    question: "En fotgängare står vid övergångsstället och ser ut att vilja gå över. Vad gör du?",
    options: [
      "Saktar in och stannar så att fotgängaren kan gå över",
      "Tutar för att varna och kör vidare",
      "Kör vidare – fotgängaren har inte klivit ut ännu",
      "Ökar farten för att hinna passera först",
    ],
    correctIndex: 0,
    explanation: "Du har väjningsplikt mot gående som är på väg ut på ett obevakat övergångsställe. Anpassa farten i god tid och stanna vid behov.",
    sourceKey: "trafikforordningen",
    sourceRef: "3 kap. 61 §",
  },
  {
    image: overgang,
    category: "Stadskörning",
    question: "En bil i körfältet bredvid har stannat före övergångsstället. Vad bör du anta?",
    options: [
      "Att den släpper fram en gående – du ska också stanna",
      "Att föraren har motorstopp – kör förbi",
      "Att den ska svänga – kör om på höger sida",
      "Ingenting särskilt, fortsätt i samma fart",
    ],
    correctIndex: 0,
    explanation: "Det är förbjudet att köra om ett fordon som stannat för att släppa fram gående vid ett övergångsställe. Räkna med att någon går över.",
    sourceKey: "trafikforordningen",
    sourceRef: "3 kap. 33 §",
  },
  {
    image: alg,
    category: "Mörkerkörning",
    question: "Du ser en älg vid vägkanten i mörkret. Vad är bäst att göra?",
    options: [
      "Sakta in kraftigt, blända av och var beredd på att fler djur kommer",
      "Helljus och tuta för att skrämma bort djuret",
      "Gasa för att passera innan den går ut",
      "Väj kraftigt åt vänster direkt",
    ],
    correctIndex: 0,
    explanation: "Älgar går ofta flera tillsammans. Sänk farten rejält och var beredd att stanna. Helljus kan blända djuret så det står still på vägen.",
    sourceKey: "trafikforordningen",
    sourceRef: "3 kap. 14 §",
  },
  {
    image: alg,
    category: "Landsväg",
    question: "Vad betyder den gula triangulära skylten med en älg?",
    options: [
      "Varning för älg – risk för viltolyckor på sträckan",
      "Viltstängsel börjar",
      "Jaktområde – förbjudet att stanna",
      "Rastplats med djurpark",
    ],
    correctIndex: 0,
    explanation: "Varningsmärket A19 'Varning för älg' sätts upp där risken för viltolyckor är stor. Anpassa farten, särskilt i gryning och skymning.",
    sourceKey: "vagmarkesforordningen",
    sourceRef: "A19 Varning för älg",
  },
  {
    image: hoger,
    category: "Väjningsregler",
    question: "Korsningen saknar vägmärken. En bil kommer från höger. Vem har företräde?",
    options: [
      "Bilen från höger – högerregeln gäller",
      "Du, eftersom du kör rakt fram",
      "Den som kommer först till korsningen",
      "Den som kör fortast",
    ],
    correctIndex: 0,
    explanation: "I en korsning utan vägmärken gäller högerregeln: du har väjningsplikt mot fordon som kommer från höger.",
    sourceKey: "trafikforordningen",
    sourceRef: "3 kap. 21 §",
  },
  {
    image: hoger,
    category: "Stadskörning",
    question: "Vilken hastighet är rimlig när du närmar dig korsningen i bostadsområdet?",
    options: [
      "Låg fart så att du kan stanna för trafik från höger",
      "Högsta tillåtna hastighet så länge du ser fri väg",
      "Samma fart som på landsväg",
      "Du behöver inte anpassa farten om du har grönt",
    ],
    correctIndex: 0,
    explanation: "Skymd sikt och högerregel kräver att du sänker farten i god tid så att du kan lämna företräde.",
    sourceKey: "trafikforordningen",
    sourceRef: "3 kap. 14 §",
  },
];

export const EXAM = { total: 65, minutes: 50, passAt: 52 } as const;
