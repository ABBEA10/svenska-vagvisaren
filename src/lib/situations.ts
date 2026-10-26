import rondell from "@/assets/sit-rondell.jpg";
import overgang from "@/assets/sit-overgangsstalle.jpg";
import alg from "@/assets/sit-alg.jpg";
import hoger from "@/assets/sit-hogerregel.jpg";
import pafart from "@/assets/sit-pafart.jpg";
import buss from "@/assets/sit-buss.jpg";
import cykel from "@/assets/sit-cykel.jpg";
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
    sourceRef: "3 kap. 22 §",
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
    sourceRef: "3 kap. 24 §",
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
    sourceRef: "3 kap. 40–41 §§",
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
    sourceRef: "3 kap. 18 §",
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
  {
    image: pafart,
    category: "Motorväg",
    question: "Du kör på påfarten och ska ut på motorvägen. Vad gäller?",
    options: ["Du har väjningsplikt mot trafiken på motorvägen och anpassar farten i accelerationsfältet", "Trafiken på motorvägen måste släppa in dig", "Du ska stanna i slutet av påfarten", "Du har företräde eftersom du kommer från höger"],
    correctIndex: 0,
    explanation: "Den som kör in på motorväg från en påfart har väjningsplikt mot trafiken på vägen. Använd accelerationsfältet för att komma upp i samma fart.",
    sourceKey: "trafikforordningen",
    sourceRef: "3 kap. 21 §",
  },
  {
    image: pafart,
    category: "Motorväg",
    question: "Hur använder du accelerationsfältet bäst?",
    options: ["Anpassar farten till trafiken i körfältet bredvid", "Kör långsamt och väntar längst fram", "Byter till vänstra körfältet direkt", "Kör fortare än all trafik för att hinna före"],
    correctIndex: 0,
    explanation: "I accelerationsfältet ska du anpassa hastigheten till trafiken i körfältet du ska köra in i.",
    sourceKey: "trafikforordningen",
    sourceRef: "3 kap. 23 §",
  },
  {
    image: buss,
    category: "Stadskörning",
    question: "Bussen vid hållplatsen blinkar vänster. Hastighetsgränsen är 50. Vad gör du?",
    options: ["Saktar in och låter bussen köra ut", "Kör förbi snabbt innan bussen kör ut", "Tutar för att visa att du kommer", "Bussen måste vänta tills du passerat"],
    correctIndex: 0,
    explanation: "Där högsta tillåtna hastighet är 50 km/h eller lägre ska du sänka farten och vid behov stanna så att en buss kan lämna en hållplats.",
    sourceKey: "trafikforordningen",
    sourceRef: "3 kap. 45 §",
  },
  {
    image: cykel,
    category: "Stadskörning",
    question: "En cyklist till höger ska just cykla ut på cykelöverfarten. Vad gäller?",
    options: ["Du har väjningsplikt mot cyklisten", "Cyklisten måste vänta på dig", "Du får köra eftersom du kör rakt fram", "Du tutar och fortsätter"],
    correctIndex: 0,
    explanation: "Vid en cykelöverfart har du väjningsplikt mot cyklister som är ute på eller just ska köra ut på överfarten.",
    sourceKey: "trafikforordningen",
    sourceRef: "3 kap. 61 a §",
  },
  {
    image: cykel,
    category: "Trafiksäkerhet",
    question: "Hur ska du närma dig cykelöverfarten?",
    options: ["Med låg fart så att du kan väja i tid", "I samma fart, cyklisterna ser dig", "Snabbt så att du hinner före", "Genom att byta till vänster körfält"],
    correctIndex: 0,
    explanation: "När du närmar dig en cykelöverfart ska du anpassa körsättet så att du kan lämna företräde.",
    sourceKey: "trafikforordningen",
    sourceRef: "3 kap. 62 §",
  },
];

export const EXAM = { total: 65, minutes: 50, passAt: 52 } as const;
