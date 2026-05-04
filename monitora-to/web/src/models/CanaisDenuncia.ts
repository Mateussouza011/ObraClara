export interface CanalDenuncia {
  nome: string;
  link: string;
  descricao: string;
}

export const CANAIS_FEDERAIS: CanalDenuncia[] = [
  {
    nome: "Fala.BR (Denúncia Anônima)",
    link: "https://falabr.cgu.gov.br/v2/",
    descricao: "Para denunciar obras federais de forma anônima. Clique em 'Registrar Manifestação' e depois 'Continuar sem se identificar'."
  },
  {
    nome: "TCU (Ouvidoria)",
    link: "https://portal.tcu.gov.br/ouvidoria/denuncia.htm",
    descricao: "Tribunal de Contas da União: Canal para denunciar desvios de recursos em obras federais."
  }
];

export const CANAIS_ESTADUAIS: CanalDenuncia[] = [
  {
    nome: "MPTO - Ouvidoria (Anônima)",
    link: "https://www.mpto.mp.br/ouvidoria/manifestation?tab=manifestation&type=anonymous",
    descricao: "Canal direto do Ministério Público do Tocantins para denúncias anônimas sobre obras do Governo Estadual."
  },
  {
    nome: "Ouvidoria-Geral do Estado (TO)",
    link: "https://ouvidoria.to.gov.br/",
    descricao: "Canal oficial da Controladoria-Geral do Estado do Tocantins."
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
  const lowCidade = cidade.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, ""); // Remove espaços

  // Cidades com portais próprios ou caminhos diferentes
  const excecoes: Record<string, string> = {
    "palmas": "https://ouvidoria.palmas.to.gov.br/ouvidoria/manifestacao/",
    "araguaina": "https://www.araguaina.to.gov.br/ouvidoria-geral",
    "portonacional": "https://portonacional.to.gov.br/ouvidoria",
    "gurupi": "https://www.gurupi.to.gov.br/ouvidoria",
    "araguana": "https://www.araguana.to.gov.br/ouvidoria"
  };

  const linkPortal = excecoes[lowCidade] || `https://acessoainformacao.${lowCidade}.to.gov.br/cidadao/ouvidoria/denuncia`;

  return {
    nome: `Ouvidoria de ${cidade}`,
    link: linkPortal,
    descricao: `Canal oficial da Prefeitura de ${cidade} para denúncias anônimas e manifestações sobre obras municipais.`
  };
};
