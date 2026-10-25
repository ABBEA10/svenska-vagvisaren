/**
 * Swedish road signs with verified pictures in /public/signs (from Wikimedia Commons,
 * public domain). AI may only reference these codes, so every picture matches its name.
 */
export const SIGNS = {
  "A1-1": "Varning för farlig kurva",
  "A2-1": "Varning för flera farliga kurvor",
  "A5-1": "Varning för avsmalnande väg",
  A6: "Varning för bro (öppningsbar)",
  A11: "Varning för stenskott",
  A15: "Varning för barn",
  A16: "Varning för cyklande och mopedförare",
  A17: "Varning för skidåkare",
  A18: "Varning för ridande",
  "A19-1": "Varning för älg",
  "A19-2": "Varning för rådjur",
  A20: "Varning för vägarbete",
  A25: "Varning för mötande trafik",
  A26: "Varning för tunnel",
  A40: "Varning för annan fara",
  B1: "Väjningsplikt",
  B2: "Stopplikt",
  "B3-1": "Övergångsställe",
  B4: "Huvudled",
  B5: "Huvudled upphör",
  B6: "Väjningsplikt mot mötande trafik",
  C1: "Förbud mot infart med fordon",
  C2: "Förbud mot trafik med fordon",
  "C31-5": "Hastighetsbegränsning 50 km/tim",
  "C31-7": "Hastighetsbegränsning 70 km/tim",
  C35: "Förbud att parkera fordon",
  C36: "Förbud att parkera fordon på dag med udda datum",
  C39: "Förbud att stanna och parkera fordon",
  "C40-1": "Lastplats",
  "D1-1": "Påbjuden körriktning",
  "D2-1": "Påbjuden körbana eller körfält",
  D3: "Cirkulationsplats",
  D4: "Påbjuden cykelbana",
  D5: "Påbjuden gångbana",
  D6: "Påbjuden gång- och cykelbana",
  E1: "Motorväg",
  E2: "Motorväg upphör",
  E3: "Motortrafikled",
  E4: "Motortrafikled upphör",
  E5: "Tättbebyggt område",
  E6: "Tättbebyggt område upphör",
  E7: "Gågata",
  E9: "Gångfartsområde",
  E19: "Parkering",
  E24: "Automatisk trafikövervakning",
  A3: "Varning för brant nedförslutning",
  A10: "Varning för slirig väg",
  B7: "Mötande trafik har väjningsplikt",
  C3: "Förbud mot trafik med annat motordrivet fordon än moped klass II",
  C4: "Förbud mot trafik med motordrivet fordon med fler än två hjul",
  C10: "Förbud mot trafik med cykel och moped klass II",
  C11: "Förbud mot trafik med moped klass II",
  C12: "Förbud mot trafik med fordon förspänt med dragdjur",
  C14: "Förbud mot ridning",
  C27: "Förbud mot omkörning",
  "C31-3": "Hastighetsbegränsning 30 km/tim",
  "C31-4": "Hastighetsbegränsning 40 km/tim",
  "C31-6": "Hastighetsbegränsning 60 km/tim",
  "C31-8": "Hastighetsbegränsning 80 km/tim",
  "C31-9": "Hastighetsbegränsning 90 km/tim",
  "C31-10": "Hastighetsbegränsning 100 km/tim",
  "C31-11": "Hastighetsbegränsning 110 km/tim",
  E8: "Gågata upphör",
  E10: "Gångfartsområde upphör",
} as const;
export type SignCode = keyof typeof SIGNS;
export const SIGN_CODES = Object.keys(SIGNS) as [SignCode, ...SignCode[]];
export const signUrl = (code: string) => `/signs/${code}.png`;

/** Assign different signs and question angles before generation, not just a random seed. */
export function planSignQuestions(count: number) {
  const codes = [...SIGN_CODES];
  for (let i = codes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = codes[i];
    const other = codes[j];
    if (current && other) {
      codes[i] = other;
      codes[j] = current;
    }
  }
  const angles = [
    "Handlingsval: beskriv en konkret körsituation och fråga hur föraren ska agera",
    "Tillåtet eller förbjudet: fråga om en konkret manöver eller ett fordon får passera",
    "Regelns tillämpning: fråga vem som ska lämna företräde eller vilken regel som gäller i en konkret situation",
    "Riskbedömning: fråga vad föraren behöver vara beredd på och hur körningen ska anpassas",
    "Betydelse: fråga vad märket innebär",
  ];
  return codes.slice(0, count).map((signCode, i) => ({
    signCode,
    angle: angles[i % angles.length],
  }));
}
