export interface Municipality {
  name: string;
  slug: string;
}

export interface Department {
  name: string;
  slug: string;
  lat: number; // Coordenadas aproximadas del centro del departamento
  lng: number;
  municipalities: Municipality[];
}

export const EL_SALVADOR_LOCATIONS: Department[] = [
  {
    name: "Ahuachapán",
    slug: "ahuachapan",
    lat: 13.9214,
    lng: -89.8450,
    municipalities: [
      { name: "Ahuachapán Norte", slug: "ahuachapan-norte" },
      { name: "Ahuachapán Centro", slug: "ahuachapan-centro" },
      { name: "Ahuachapán Sur", slug: "ahuachapan-sur" }
    ]
  },
  {
    name: "Cabañas",
    slug: "cabanas",
    lat: 13.8642,
    lng: -88.7494,
    municipalities: [
      { name: "Cabañas Este", slug: "cabanas-este" },
      { name: "Cabañas Oeste", slug: "cabanas-oeste" }
    ]
  },
  {
    name: "Chalatenango",
    slug: "chalatenango",
    lat: 14.0394,
    lng: -88.9367,
    municipalities: [
      { name: "Chalatenango Norte", slug: "chalatenango-norte" },
      { name: "Chalatenango Centro", slug: "chalatenango-centro" },
      { name: "Chalatenango Sur", slug: "chalatenango-sur" }
    ]
  },
  {
    name: "Cuscatlán",
    slug: "cuscatlan",
    lat: 13.7914,
    lng: -88.9797,
    municipalities: [
      { name: "Cuscatlán Norte", slug: "cuscatlan-norte" },
      { name: "Cuscatlán Sur", slug: "cuscatlan-sur" }
    ]
  },
  {
    name: "La Libertad",
    slug: "la-libertad",
    lat: 13.6769,
    lng: -89.3592,
    municipalities: [
      { name: "La Libertad Norte", slug: "la-libertad-norte" },
      { name: "La Libertad Centro", slug: "la-libertad-centro" },
      { name: "La Libertad Oeste", slug: "la-libertad-oeste" },
      { name: "La Libertad Este", slug: "la-libertad-este" },
      { name: "La Libertad Costa", slug: "la-libertad-costa" },
      { name: "La Libertad Sur", slug: "la-libertad-sur" }
    ]
  },
  {
    name: "La Paz",
    slug: "la-paz",
    lat: 13.5261,
    lng: -88.9514,
    municipalities: [
      { name: "La Paz Centro", slug: "la-paz-centro" },
      { name: "La Paz Este", slug: "la-paz-este" },
      { name: "La Paz Oeste", slug: "la-paz-oeste" }
    ]
  },
  {
    name: "La Unión",
    slug: "la-union",
    lat: 13.3369,
    lng: -87.8439,
    municipalities: [
      { name: "La Unión Norte", slug: "la-union-norte" },
      { name: "La Unión Sur", slug: "la-union-sur" }
    ]
  },
  {
    name: "Morazán",
    slug: "morazan",
    lat: 13.7547,
    lng: -88.1186,
    municipalities: [
      { name: "Morazán Norte", slug: "morazan-norte" },
      { name: "Morazán Sur", slug: "morazan-sur" }
    ]
  },
  {
    name: "San Miguel",
    slug: "san-miguel",
    lat: 13.4833,
    lng: -88.1833,
    municipalities: [
      { name: "San Miguel Norte", slug: "san-miguel-norte" },
      { name: "San Miguel Centro", slug: "san-miguel-centro" },
      { name: "San Miguel Oeste", slug: "san-miguel-oeste" }
    ]
  },
  {
    name: "San Salvador",
    slug: "san-salvador",
    lat: 13.6989,
    lng: -89.1914,
    municipalities: [
      { name: "San Salvador Norte", slug: "san-salvador-norte" },
      { name: "San Salvador Oeste", slug: "san-salvador-oeste" },
      { name: "San Salvador Centro", slug: "san-salvador-centro" },
      { name: "San Salvador Este", slug: "san-salvador-este" },
      { name: "San Salvador Sur", slug: "san-salvador-sur" }
    ]
  },
  {
    name: "San Vicente",
    slug: "san-vicente",
    lat: 13.6442,
    lng: -88.7844,
    municipalities: [
      { name: "San Vicente Norte", slug: "san-vicente-norte" },
      { name: "San Vicente Sur", slug: "san-vicente-sur" }
    ]
  },
  {
    name: "Santa Ana",
    slug: "santa-ana",
    lat: 13.9942,
    lng: -89.5597,
    municipalities: [
      { name: "Santa Ana Norte", slug: "santa-ana-norte" },
      { name: "Santa Ana Centro", slug: "santa-ana-centro" },
      { name: "Santa Ana Este", slug: "santa-ana-este" },
      { name: "Santa Ana Oeste", slug: "santa-ana-oeste" }
    ]
  },
  {
    name: "Sonsonate",
    slug: "sonsonate",
    lat: 13.7189,
    lng: -89.7242,
    municipalities: [
      { name: "Sonsonate Norte", slug: "sonsonate-norte" },
      { name: "Sonsonate Centro", slug: "sonsonate-centro" },
      { name: "Sonsonate Este", slug: "sonsonate-este" },
      { name: "Sonsonate Oeste", slug: "sonsonate-oeste" }
    ]
  },
  {
    name: "Usulután",
    slug: "usulutan",
    lat: 13.3500,
    lng: -88.4500,
    municipalities: [
      { name: "Usulután Norte", slug: "usulutan-norte" },
      { name: "Usulután Este", slug: "usulutan-este" },
      { name: "Usulután Oeste", slug: "usulutan-oeste" }
    ]
  }
];
