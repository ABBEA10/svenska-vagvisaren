/** Paragrafer i trafikförordningen 3 kap., kontrollerade mot lagtexten hos Riksdagen. */
export const TF_PARAGRAPHS: Record<string, string> = {
  "3 kap. 2 §": "avstånd till framförvarande fordon",
  "3 kap. 5 §": "visa avsikt att väja",
  "3 kap. 7 §": "köra i körfältet längst till höger",
  "3 kap. 11 §": "spärrområde och heldragen linje",
  "3 kap. 13 §": "körriktning i cirkulationsplats",
  "3 kap. 14 §": "anpassa hastigheten",
  "3 kap. 15 §": "tillräckligt låg hastighet i vissa fall",
  "3 kap. 17 §": "50 km/h inom tättbebyggt område",
  "3 kap. 18 §": "högerregeln",
  "3 kap. 19 §": "stopplikt och stopplinje",
  "3 kap. 20 §": "körsätt i vägkorsning",
  "3 kap. 21 §": "påfart till huvudled, motorväg, motortrafikled",
  "3 kap. 22 §": "väjningsplikt vid infart i cirkulationsplats",
  "3 kap. 23 §": "accelerationsfält",
  "3 kap. 24 §": "placering inför sväng",
  "3 kap. 25 §": "val av körfält före korsning",
  "3 kap. 26 §": "svänga utan fara, väjningsplikt vid sväng",
  "3 kap. 30 §": "möte, håll till höger",
  "3 kap. 31 §": "omkörning till vänster",
  "3 kap. 32 §": "omkörning endast utan fara",
  "3 kap. 33 §": "avstånd i sidled vid omkörning",
  "3 kap. 36 §": "fritt körfält vid omkörning",
  "3 kap. 39 §": "omkörning i vägkorsning",
  "3 kap. 40 §": "omkörning vid obevakat övergångsställe",
  "3 kap. 41 §": "passera fordon i annat körfält",
  "3 kap. 43 §": "starta, byta körfält",
  "3 kap. 44 §": "två körfält löper samman (blixtlås)",
  "3 kap. 45 §": "buss som lämnar hållplats",
  "3 kap. 46 §": "vända och backa",
  "3 kap. 47 §": "förbud att stanna eller parkera",
  "3 kap. 53 §": "stanna/parkera nära övergångsställe och korsning",
  "3 kap. 55 §": "parkeringsförbud",
  "3 kap. 57 §": "varningstriangel",
  "3 kap. 58 §": "väjningsplikt mot gående",
  "3 kap. 59 §": "företräde på cykelbana",
  "3 kap. 60 §": "bevakat övergångsställe",
  "3 kap. 61 §": "obevakat övergångsställe",
  "3 kap. 61 a §": "cykelöverfart",
  "3 kap. 62 §": "närma sig övergångsställe",
  "3 kap. 64 §": "ljud- och ljussignaler",
  "3 kap. 65 §": "visa tecken (blinkers)",
  "3 kap. 67 §": "inte blända",
  "3 kap. 68 §": "lyktor tända vid färd",
};

/** Behåll en verifierad paragraf; annars visa bara kapitlet så hänvisningen aldrig blir fel. */
export function verifyTfRef(ref: string): string {
  const norm = ref.replace(/\s+/g, " ").trim();
  const m = norm.match(/^(\d+) kap\. (\d+(?: a)?) §/);
  if (!m) return /^\d+ kap\.$/.test(norm) ? norm : ref;
  const key = `${m[1]} kap. ${m[2]} §`;
  return TF_PARAGRAPHS[key] ? key : `${m[1]} kap.`;
}
