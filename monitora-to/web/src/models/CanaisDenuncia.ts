export interface CanalDenuncia {
  nome: string;
  link: string;
  descricao: string;
}

export const CANAIS_FEDERAIS: CanalDenuncia[] = [
  {
    nome: "Fala.BR (Governo Federal)",
    link: "https://falabr.cgu.gov.br/",
    descricao: "Plataforma integrada para denúncias de órgãos federais (CGU)."
  },
  {
    nome: "Tribunal de Contas da União (TCU)",
    link: "https://denuncia.apps.tcu.gov.br/",
    descricao: "Para denúncias sobre mau uso de recursos federais e irregularidades em obras da União."
  }
];

export const CANAIS_ESTADUAIS: CanalDenuncia[] = [
  {
    nome: "Ouvidoria-Geral do Estado do Tocantins",
    link: "https://falabr.cgu.gov.br/publico/TO/Manifestacao/RegistrarManifestacao",
    descricao: "Canal oficial para denúncias sobre obras e serviços do Governo do Estado do Tocantins."
  }
];

export const CIDADES_TO = [
  "Abreulândia", "Aguiarnópolis", "Aliança do Tocantins", "Almas", "Alvorada", "Ananás", "Angico", 
  "Aparecida do Rio Negro", "Aragominas", "Araguacema", "Araguaçu", "Araguaína", "Araguanã", 
  "Araguatins", "Arapoema", "Arraias", "Augustinópolis", "Aurora do Tocantins", "Axixá do Tocantins", 
  "Babaçulândia", "Bandeirantes do Tocantins", "Barra do Ouro", "Barrolândia", "Bernardo Sayão", 
  "Bom Jesus do Tocantins", "Brasilândia do Tocantins", "Brejinho de Nazaré", "Buriti do Tocantins", 
  "Cachoeirinha", "Campos Lindos", "Cariri do Tocantins", "Carmolândia", "Carrasco Bonito", 
  "Caseara", "Centenário", "Chapada da Natividade", "Chapada de Areia", "Colinas do Tocantins", 
  "Colméia", "Combinado", "Conceição do Tocantins", "Couto Magalhães", "Cristalândia", 
  "Crixás do Tocantins", "Darcinópolis", "Dianópolis", "Divinópolis do Tocantins", 
  "Dois Irmãos do Tocantins", "Dueré", "Esperantina", "Fátima", "Figueirópolis", "Filadélfia", 
  "Formoso do Araguaia", "Fortaleza do Tabocão", "Goianorte", "Goiatins", "Guaraí", "Gurupi", 
  "Ipueiras", "Itacajá", "Itaguatins", "Itapiratins", "Itaporã do Tocantins", "Jaú do Tocantins", 
  "Juarina", "Lagoa da Confusão", "Lagoa do Tocantins", "Lajeado", "Lavandeira", "Lizarda", 
  "Luzinópolis", "Marianópolis do Tocantins", "Mateiros", "Maurilândia do Tocantins", 
  "Miracema do Tocantins", "Miranorte", "Monte do Carmo", "Monte Santo do Tocantins", 
  "Muricilândia", "Natividade", "Nazaré", "Nova Olinda", "Nova Rosalândia", "Novo Acordo", 
  "Novo Alegre", "Novo Jardim", "Oliveira de Fátima", "Palmas", "Palmeirante", 
  "Palmeiras do Tocantins", "Palmeirópolis", "Paraíso do Tocantins", "Paranã", "Pau D'Arco", 
  "Pedro Afonso", "Peixe", "Pequizeiro", "Pindorama do Tocantins", "Piraquê", "Pium", 
  "Ponte Alta do Bom Jesus", "Ponte Alta do Tocantins", "Porto Alegre do Tocantins", 
  "Porto Nacional", "Praia Norte", "Presidente Kennedy", "Pugmil", "Recursolândia", 
  "Riachinho", "Rio da Conceição", "Rio dos Bois", "Rio Sono", "Sampaio", "Sandolândia", 
  "Santa Fé do Araguaia", "Santa Maria do Tocantins", "Santa Rita do Tocantins", 
  "Santa Rosa do Tocantins", "Santa Tereza do Tocantins", "Santa Terezinha do Tocantins", 
  "São Bento do Tocantins", "São Félix do Tocantins", "São Miguel do Tocantins", 
  "São Salvador do Tocantins", "São Sebastião do Tocantins", "São Valério", "Silvanópolis", 
  "Sítio Novo do Tocantins", "Sucupira", "Taguatinga", "Taipas do Tocantins", "Talismã", 
  "Tocantínia", "Tocantinópolis", "Tupirama", "Tupiratins", "Wanderlândia", "Xambioá"
];

export const getCanalMunicipal = (cidade: string): CanalDenuncia => {
  // Specific links for major cities if known, otherwise fallback to MPTO
  const lowCidade = cidade.toLowerCase();
  
  if (lowCidade === "palmas") {
    return {
      nome: "Ouvidoria de Palmas",
      link: "https://palmas.to.gov.br/portal/ouvidoria/",
      descricao: "Canal oficial para denúncias sobre obras e serviços da Prefeitura de Palmas."
    };
  }
  
  if (lowCidade === "araguaína") {
    return {
      nome: "Ouvidoria de Araguaína",
      link: "https://araguaina.to.gov.br/Ouvidoria",
      descricao: "Canal oficial para denúncias sobre obras e serviços da Prefeitura de Araguaína."
    };
  }

  if (lowCidade === "gurupi") {
    return {
      nome: "Ouvidoria de Gurupi",
      link: "https://gurupi.to.gov.br/ouvidoria",
      descricao: "Canal oficial para denúncias sobre obras e serviços da Prefeitura de Gurupi."
    };
  }

  // Fallback to MPTO for other municipalities as it covers all of them
  return {
    nome: `Ministério Público - Promotoria de ${cidade}`,
    link: "https://www.mpto.mp.br/ouvidoria/",
    descricao: `Para denúncias sobre irregularidades em obras municipais de ${cidade}. O Ministério Público atua na fiscalização do patrimônio público.`
  };
};
