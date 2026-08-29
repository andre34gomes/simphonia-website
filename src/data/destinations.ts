export type Continent =
  | "Europe"
  | "Asia"
  | "Americas"
  | "Africa"
  | "Oceania";

export interface Destination {
  /** ISO 3166-1 alpha-2 code, used to render the flag emoji. */
  code: string;
  name: string;
  continent: Continent;
  /** Highlighted destinations get a "Popular" badge in the grid. */
  popular?: boolean;
}

/**
 * Curated list of destinations covered by Simphonia, grouped by continent.
 * This is a representative sample of the app's full 200+ country catalog —
 * used to keep the marketing site fast and reliable without depending on
 * the live pricing API.
 */
export const destinations: Destination[] = [
  // Europe
  { code: "PT", name: "Portugal", continent: "Europe", popular: true },
  { code: "ES", name: "Spain", continent: "Europe", popular: true },
  { code: "FR", name: "France", continent: "Europe", popular: true },
  { code: "IT", name: "Italy", continent: "Europe", popular: true },
  { code: "DE", name: "Germany", continent: "Europe", popular: true },
  { code: "GB", name: "United Kingdom", continent: "Europe", popular: true },
  { code: "IE", name: "Ireland", continent: "Europe" },
  { code: "NL", name: "Netherlands", continent: "Europe" },
  { code: "BE", name: "Belgium", continent: "Europe" },
  { code: "CH", name: "Switzerland", continent: "Europe" },
  { code: "AT", name: "Austria", continent: "Europe" },
  { code: "SE", name: "Sweden", continent: "Europe" },
  { code: "NO", name: "Norway", continent: "Europe" },
  { code: "DK", name: "Denmark", continent: "Europe" },
  { code: "FI", name: "Finland", continent: "Europe" },
  { code: "IS", name: "Iceland", continent: "Europe" },
  { code: "PL", name: "Poland", continent: "Europe" },
  { code: "CZ", name: "Czech Republic", continent: "Europe" },
  { code: "HU", name: "Hungary", continent: "Europe" },
  { code: "GR", name: "Greece", continent: "Europe", popular: true },
  { code: "HR", name: "Croatia", continent: "Europe", popular: true },
  { code: "RO", name: "Romania", continent: "Europe" },
  { code: "BG", name: "Bulgaria", continent: "Europe" },
  { code: "SK", name: "Slovakia", continent: "Europe" },
  { code: "SI", name: "Slovenia", continent: "Europe" },
  { code: "EE", name: "Estonia", continent: "Europe" },
  { code: "LV", name: "Latvia", continent: "Europe" },
  { code: "LT", name: "Lithuania", continent: "Europe" },
  { code: "LU", name: "Luxembourg", continent: "Europe" },
  { code: "MT", name: "Malta", continent: "Europe" },
  { code: "CY", name: "Cyprus", continent: "Europe" },
  { code: "UA", name: "Ukraine", continent: "Europe" },
  { code: "RS", name: "Serbia", continent: "Europe" },
  { code: "AL", name: "Albania", continent: "Europe" },
  { code: "ME", name: "Montenegro", continent: "Europe" },
  { code: "BA", name: "Bosnia and Herzegovina", continent: "Europe" },
  { code: "MK", name: "North Macedonia", continent: "Europe" },
  { code: "MD", name: "Moldova", continent: "Europe" },
  { code: "MC", name: "Monaco", continent: "Europe" },
  { code: "AD", name: "Andorra", continent: "Europe" },

  // Asia
  { code: "JP", name: "Japan", continent: "Asia", popular: true },
  { code: "KR", name: "South Korea", continent: "Asia", popular: true },
  { code: "CN", name: "China", continent: "Asia", popular: true },
  { code: "TH", name: "Thailand", continent: "Asia", popular: true },
  { code: "VN", name: "Vietnam", continent: "Asia", popular: true },
  { code: "ID", name: "Indonesia", continent: "Asia" },
  { code: "MY", name: "Malaysia", continent: "Asia" },
  { code: "SG", name: "Singapore", continent: "Asia", popular: true },
  { code: "PH", name: "Philippines", continent: "Asia" },
  { code: "IN", name: "India", continent: "Asia", popular: true },
  { code: "LK", name: "Sri Lanka", continent: "Asia" },
  { code: "NP", name: "Nepal", continent: "Asia" },
  { code: "AE", name: "United Arab Emirates", continent: "Asia", popular: true },
  { code: "SA", name: "Saudi Arabia", continent: "Asia" },
  { code: "QA", name: "Qatar", continent: "Asia" },
  { code: "IL", name: "Israel", continent: "Asia" },
  { code: "TR", name: "Turkey", continent: "Asia", popular: true },
  { code: "JO", name: "Jordan", continent: "Asia" },
  { code: "KH", name: "Cambodia", continent: "Asia" },
  { code: "LA", name: "Laos", continent: "Asia" },
  { code: "MM", name: "Myanmar", continent: "Asia" },
  { code: "TW", name: "Taiwan", continent: "Asia" },
  { code: "HK", name: "Hong Kong", continent: "Asia" },
  { code: "MO", name: "Macau", continent: "Asia" },
  { code: "MN", name: "Mongolia", continent: "Asia" },
  { code: "KZ", name: "Kazakhstan", continent: "Asia" },
  { code: "UZ", name: "Uzbekistan", continent: "Asia" },
  { code: "GE", name: "Georgia", continent: "Asia" },
  { code: "AM", name: "Armenia", continent: "Asia" },
  { code: "AZ", name: "Azerbaijan", continent: "Asia" },
  { code: "BH", name: "Bahrain", continent: "Asia" },
  { code: "KW", name: "Kuwait", continent: "Asia" },
  { code: "OM", name: "Oman", continent: "Asia" },

  // Americas
  { code: "US", name: "United States", continent: "Americas", popular: true },
  { code: "CA", name: "Canada", continent: "Americas", popular: true },
  { code: "MX", name: "Mexico", continent: "Americas", popular: true },
  { code: "BR", name: "Brazil", continent: "Americas", popular: true },
  { code: "AR", name: "Argentina", continent: "Americas" },
  { code: "CL", name: "Chile", continent: "Americas" },
  { code: "CO", name: "Colombia", continent: "Americas" },
  { code: "PE", name: "Peru", continent: "Americas" },
  { code: "EC", name: "Ecuador", continent: "Americas" },
  { code: "UY", name: "Uruguay", continent: "Americas" },
  { code: "PY", name: "Paraguay", continent: "Americas" },
  { code: "BO", name: "Bolivia", continent: "Americas" },
  { code: "CR", name: "Costa Rica", continent: "Americas", popular: true },
  { code: "PA", name: "Panama", continent: "Americas" },
  { code: "GT", name: "Guatemala", continent: "Americas" },
  { code: "DO", name: "Dominican Republic", continent: "Americas", popular: true },
  { code: "JM", name: "Jamaica", continent: "Americas" },
  { code: "CU", name: "Cuba", continent: "Americas" },
  { code: "PR", name: "Puerto Rico", continent: "Americas" },
  { code: "BS", name: "Bahamas", continent: "Americas" },
  { code: "VE", name: "Venezuela", continent: "Americas" },

  // Africa
  { code: "ZA", name: "South Africa", continent: "Africa", popular: true },
  { code: "EG", name: "Egypt", continent: "Africa", popular: true },
  { code: "MA", name: "Morocco", continent: "Africa", popular: true },
  { code: "KE", name: "Kenya", continent: "Africa" },
  { code: "TZ", name: "Tanzania", continent: "Africa" },
  { code: "NG", name: "Nigeria", continent: "Africa" },
  { code: "GH", name: "Ghana", continent: "Africa" },
  { code: "ET", name: "Ethiopia", continent: "Africa" },
  { code: "TN", name: "Tunisia", continent: "Africa" },
  { code: "DZ", name: "Algeria", continent: "Africa" },
  { code: "UG", name: "Uganda", continent: "Africa" },
  { code: "RW", name: "Rwanda", continent: "Africa" },
  { code: "NA", name: "Namibia", continent: "Africa" },
  { code: "BW", name: "Botswana", continent: "Africa" },
  { code: "ZM", name: "Zambia", continent: "Africa" },
  { code: "ZW", name: "Zimbabwe", continent: "Africa" },
  { code: "SN", name: "Senegal", continent: "Africa" },
  { code: "MU", name: "Mauritius", continent: "Africa", popular: true },
  { code: "SC", name: "Seychelles", continent: "Africa" },
  { code: "CI", name: "Ivory Coast", continent: "Africa" },

  // Oceania
  { code: "AU", name: "Australia", continent: "Oceania", popular: true },
  { code: "NZ", name: "New Zealand", continent: "Oceania", popular: true },
  { code: "FJ", name: "Fiji", continent: "Oceania" },
  { code: "PG", name: "Papua New Guinea", continent: "Oceania" },
  { code: "PF", name: "French Polynesia", continent: "Oceania" },
  { code: "VU", name: "Vanuatu", continent: "Oceania" },
  { code: "WS", name: "Samoa", continent: "Oceania" },
  { code: "NC", name: "New Caledonia", continent: "Oceania" },
];

export const continents: Continent[] = [
  "Europe",
  "Asia",
  "Americas",
  "Africa",
  "Oceania",
];
