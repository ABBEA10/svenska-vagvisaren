/** Whitelisted official sources. AI may only cite these keys, so links are always real. */
export const SOURCES = {
  trafikforordningen: {
    name: "Trafikförordningen (1998:1276)",
    url: "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/trafikforordning-19981276_sfs-1998-1276/",
  },
  vagmarkesforordningen: {
    name: "Vägmärkesförordningen (2007:90)",
    url: "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/vagmarkesforordning-200790_sfs-2007-90/",
  },
  vagmarken: {
    name: "Transportstyrelsen – Vägmärken",
    url: "https://www.transportstyrelsen.se/sv/vagtrafik/vagmarken/",
  },
  korkortsforordningen: {
    name: "Körkortsförordningen (1998:980)",
    url: "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/korkortsforordning-1998980_sfs-1998-980/",
  },
  fordonsforordningen: {
    name: "Fordonsförordningen (2009:211)",
    url: "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/fordonsforordning-2009211_sfs-2009-211/",
  },
  trafikverket_korkort: {
    name: "Trafikverket – Körkortsprov B",
    url: "https://www.trafikverket.se/korkort/",
  },
  transportstyrelsen_korkort: {
    name: "Transportstyrelsen – Körkort",
    url: "https://www.transportstyrelsen.se/sv/vagtrafik/korkort/",
  },
} as const;
export type SourceKey = keyof typeof SOURCES;
export const SOURCE_KEYS = Object.keys(SOURCES) as [SourceKey, ...SourceKey[]];
