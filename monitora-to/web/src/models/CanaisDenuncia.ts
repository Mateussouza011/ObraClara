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

  const megasoftSuffix = '/ouvidoria-e-e-sic/ouvidoria/reclamacao';
  const cleanSuffix = '/transparencia/ouvidoria';
  const faleConoscoSuffix = '/fale-conosco';
  const faleConoscoNoHyphenSuffix = '/faleconosco/transparencia/ouvidoria';

  const megasoftBaseUrls: Record<string, string> = {
    almas: 'https://almas.megasofttransparencia.com.br',
    barrolandia: 'https://barrolandia.megasofttransparencia.com.br',
    bomjesusdotocantins: 'https://bomjesusdotocantins.megasofttransparencia.com.br',
    camposlindos: 'https://camposlindos.megasofttransparencia.com.br',
    caseara: 'https://caseara.megasofttransparencia.com.br',
    chapadadanatividade: 'https://chapadadanatividade.megasofttransparencia.com.br',
    combinado: 'https://combinado.megasofttransparencia.com.br',
    conceicaodotocantins: 'https://conceicaodotocantins.megasofttransparencia.com.br',
    coutomagalhaes: 'https://coutodemagalhaes.megasofttransparencia.com.br',
    darcinopolis: 'https://darcinopolis.megasofttransparencia.com.br',
    dianopolis: 'https://dianopolis.megasofttransparencia.com.br',
    fortalezadotabocao: 'https://tabocao.megasofttransparencia.com.br',
    goianorte: 'https://goianorte.megasofttransparencia.com.br',
    guarai: 'https://guarai.megasofttransparencia.com.br',
    itacaja: 'https://itacaja.megasofttransparencia.com.br',
    itaporadotocantins: 'https://itaporadotocantins.megasofttransparencia.com.br',
    miracemadotocantins: 'https://miracemadotocantins.megasofttransparencia.com.br',
    miranorte: 'https://miranorte.megasofttransparencia.com.br',
    montesantodotocantins: 'https://montesantodotocantins.megasofttransparencia.com.br',
    novaolinda: 'https://novaolinda.megasofttransparencia.com.br',
    novojardim: 'https://novojardim.megasofttransparencia.com.br',
    palmeiropolis: 'https://palmeiropolis.megasofttransparencia.com.br',
    recursolandia: 'https://recursolandia.megasofttransparencia.com.br',
    santarosadotocantins: 'https://santarosadotocantins.megasofttransparencia.com.br',
    santaterezinhadotocantins: 'https://santaterezinhadotocantins.megasofttransparencia.com.br',
    taguatinga: 'https://taguatinga.megasofttransparencia.com.br',
    tocantinia: 'https://tocantinia.megasofttransparencia.com.br',
    presidentekennedy: 'https://presidentekennedy.megasofttransparencia.com.br',
  };

  const portalEspecifico: Record<string, string> = {
    almas: `${megasoftBaseUrls.almas}${megasoftSuffix}`,
    angico: 'https://www.angico.to.gov.br/ouvidoria',
    aparecidadorionegro: 'https://www.aparecidadorionegro.to.gov.br/transparencia/ouvidoria',
    aragominas: 'https://aragominas.to.gov.br/ouvidoria/',
    arapoema: `http://www.arapoema.to.gov.br${faleConoscoSuffix}`,
    arraias: 'http://www.arraias.to.gov.br/transparencia/ouvidoria',
    babaculandia: 'https://www.babaculandia.to.gov.br/transparencia/ouvidoria',
    barrolandia: `${megasoftBaseUrls.barrolandia}${megasoftSuffix}`,
    bomjesusdotocantins: `${megasoftBaseUrls.bomjesusdotocantins}${megasoftSuffix}`,
    cachoeirinha: `https://cachoeirinha.to.gov.br${cleanSuffix}`,
    camposlindos: `${megasoftBaseUrls.camposlindos}${megasoftSuffix}`,
    caseara: `${megasoftBaseUrls.caseara}${megasoftSuffix}`,
    centenario: 'https://www.centenario.to.gov.br/transparencia/ouvidoria',
    chapadadeareia: `https://chapadadeareia.to.gov.br${cleanSuffix}`,
    chapadadanatividade: `${megasoftBaseUrls.chapadadanatividade}${megasoftSuffix}`,
    combinado: `${megasoftBaseUrls.combinado}${megasoftSuffix}`,
    conceicaodotocantins: `${megasoftBaseUrls.conceicaodotocantins}${megasoftSuffix}`,
    coutomagalhaes: `${megasoftBaseUrls.coutomagalhaes}${megasoftSuffix}`,
    crixasdotocantins: 'https://crixas.to.gov.br/transparencia/ouvidoria/',
    darcinopolis: `${megasoftBaseUrls.darcinopolis}${megasoftSuffix}`,
    dianopolis: `${megasoftBaseUrls.dianopolis}${megasoftSuffix}`,
    divinopolisdotocantins: `https://www.divinopolis.to.gov.br${cleanSuffix}`,
    fatima: 'https://www.fatima.to.gov.br/ouvidoria',
    filadelfia: `http://www.filadelfia.to.gov.br${cleanSuffix}`,
    fortalezadotabocao: `${megasoftBaseUrls.fortalezadotabocao}${megasoftSuffix}`,
    goianorte: `${megasoftBaseUrls.goianorte}${megasoftSuffix}`,
    goiatins: 'https://www.fenix.com.br/transparencia/ouvidoria',
    guarai: `${megasoftBaseUrls.guarai}${megasoftSuffix}`,
    itacaja: `${megasoftBaseUrls.itacaja}${megasoftSuffix}`,
    itaguatins: 'https://www.itaguatins.to.gov.br/ouvidoria',
    itaporadotocantins: `${megasoftBaseUrls.itaporadotocantins}${megasoftSuffix}`,
    lagoadaconfusao: `https://www.lagoadaconfusao.to.gov.br${cleanSuffix}`,
    lajeado: `https://www.lajeado.to.gov.br${cleanSuffix}`,
    lavandeira: `http://www.lavandeira.to.gov.br${cleanSuffix}`,
    luzinopolis: 'https://www.fenix.com.br/transparencia/ouvidoria',
    miracemadotocantins: `${megasoftBaseUrls.miracemadotocantins}${megasoftSuffix}`,
    miranorte: `${megasoftBaseUrls.miranorte}${megasoftSuffix}`,
    montedocarmo: `https://www.montedocarmo.to.gov.br${faleConoscoNoHyphenSuffix}`,
    montesantodotocantins: `${megasoftBaseUrls.montesantodotocantins}${megasoftSuffix}`,
    muricilandia: 'https://www.muricilandia.to.gov.br/ouvidoria',
    novaolinda: `${megasoftBaseUrls.novaolinda}${megasoftSuffix}`,
    novoacordo: 'https://www.novoacordo.to.gov.br/ouvidoria',
    novoalegre: `http://www.novoalegre.to.gov.br${cleanSuffix}`,
    novojardim: `${megasoftBaseUrls.novojardim}${megasoftSuffix}`,
    palmeirante: 'https://www.palmeirante.to.gov.br/ouvidoria',
    palmeiropolis: `${megasoftBaseUrls.palmeiropolis}${megasoftSuffix}`,
    paraisodotocantins: 'https://paraiso.to.gov.br/ouvidoria/',
    pindorama: 'https://www.pindoramadotocantins.to.leg.br/transparencia/ouvidoria',
    pontealtadobomjesus: `http://www.pontealtadobomjesus.to.gov.br${cleanSuffix}`,
    prainorte: `https://praianorte.to.gov.br${cleanSuffix}`,
    presidentekennedy: `${megasoftBaseUrls.presidentekennedy}${megasoftSuffix}`,
    pugmil: 'https://www.pugmil.to.gov.br/transparencia/ouvidoria',
    recursolandia: `${megasoftBaseUrls.recursolandia}${megasoftSuffix}`,
    riachinho: `https://www.riachinho.to.gov.br${cleanSuffix}`,
    riosono: 'https://riosono.to.gov.br/_servicos-online/ouvidoria/',
    sandolandia: 'https://sandolandia.to.gov.br/ouvidoria-2/',
    santafe: 'http://www.santafedoaraguaia.to.gov.br/transparencia/ouvidoria',
    santarosadotocantins: `${megasoftBaseUrls.santarosadotocantins}${megasoftSuffix}`,
    santaterezinhadotocantins: `${megasoftBaseUrls.santaterezinhadotocantins}${megasoftSuffix}`,
    saobentodotocantins: 'https://www.fenix.com.br/transparencia/ouvidoria',
    saosebastiaodotocantins: 'https://www.fenix.com.br/transparencia/ouvidoria',
    saovalerio: 'https://saovalerio.to.gov.br/ouvidoria-voce-tem-voz-ativa-na-gestao-municipal/',
    silvanopolis: `https://www.silvanopolis.to.gov.br${cleanSuffix}`,
    taguatinga: `${megasoftBaseUrls.taguatinga}${megasoftSuffix}`,
    talisma: 'https://www.talisma.to.gov.br/ouvidoria',
    tocantinia: `${megasoftBaseUrls.tocantinia}${megasoftSuffix}`,
    tocantinopolis: `https://www.tocantinopolis.to.gov.br${cleanSuffix}`,
    tupirama: `https://www.tupirama.to.gov.br${cleanSuffix}`,
    wanderlandia: 'https://www.fenix.com.br/transparencia/ouvidoria',
  };

  const linkPortal =
    portalEspecifico[lowCidade] ||
    (lowCidade === 'palmas'
      ? 'https://ouvidoria.palmas.to.gov.br/ouvidoria/manifestacao/'
      : lowCidade === 'araguaina'
        ? 'https://www.araguaina.to.gov.br/ouvidoria-geral'
        : lowCidade === 'portonacional'
          ? 'https://portonacional.to.gov.br/ouvidoria'
          : lowCidade === 'gurupi'
            ? 'https://www.gurupi.to.gov.br/ouvidoria'
            : lowCidade === 'araguana'
              ? 'https://www.araguana.to.gov.br/ouvidoria'
              : `https://acessoainformacao.${lowCidade}.to.gov.br/cidadao/ouvidoria/denuncia`);

  return {
    nome: `Ouvidoria de ${cidade}`,
    link: linkPortal,
    descricao: `Canal oficial da Prefeitura de ${cidade} para denúncias anônimas e manifestações sobre obras municipais.`
  };
};
