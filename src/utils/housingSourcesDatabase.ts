export interface HousingSource {
    id: string;
    name: string;
    url: string;
    category: string;
    trust_level: number; // 1-10 (10 = Oficial/Governamental, 9 = Agregador Líder, etc.)
}

export const HOUSING_SOURCES_DATABASE: HousingSource[] = [
    { id: 'house-1', name: 'Idealista', url: 'https://www.idealista.pt/', category: 'Imobiliária / Líder', trust_level: 9 },
    { id: 'house-2', name: 'Imovirtual', url: 'https://www.imovirtual.com/', category: 'Imobiliária / Líder', trust_level: 9 },
    { id: 'house-3', name: 'OLX Imóveis', url: 'https://www.olx.pt/imoveis/casas-moradias-para-arrendar-vender/', category: 'Classificados', trust_level: 8 },
    { id: 'house-4', name: 'CustoJusto', url: 'https://www.custojusto.pt/', category: 'Classificados', trust_level: 8 },
    { id: 'house-5', name: 'Uniplaces', url: 'https://www.uniplaces.com/', category: 'Alojamento Universitário/Médio Prazo', trust_level: 9 },
    { id: 'house-6', name: 'Casa SAPO', url: 'https://casa.sapo.pt/', category: 'Portal Imobiliário', trust_level: 9 },
    { id: 'house-7', name: 'BQuarto', url: 'https://www.bquarto.pt/', category: 'Arrendamento de Quartos', trust_level: 8 },
    { id: 'house-8', name: 'Roomgo', url: 'https://www.roomgo.pt/', category: 'Arrendamento de Quartos', trust_level: 8 },
    { id: 'house-9', name: 'Casafari', url: 'https://pt.casafari.com/', category: 'Metasearch Imobiliário', trust_level: 8 },
    { id: 'house-10', name: 'Spotahome', url: 'https://www.spotahome.com/', category: 'Reserva Online Médio Prazo', trust_level: 9 },
    { id: 'house-11', name: 'HousingAnywhere', url: 'https://housinganywhere.com/', category: 'Plataforma Internacional / Estudantes', trust_level: 9 },
    { id: 'house-12', name: 'Pure Portugal', url: 'https://pureportugal.co.uk/', category: 'Propriedades Rurais / Ecológicas', trust_level: 8 },
    { id: 'house-13', name: 'Airbnb Portugal', url: 'https://www.airbnb.pt/portugal/stays', category: 'Alojamento Local / Curto-Médio Prazo', trust_level: 9 }
];
