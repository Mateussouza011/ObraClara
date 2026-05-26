import React, { useMemo, useState } from 'react';
import { Layout, type TutorialStep } from '../components';
import {
  CANAIS_FEDERAIS,
  CANAIS_ESTADUAIS,
  CIDADES_TO,
  getCanalMunicipal,
  type CanalDenuncia,
} from '../models';
import './DenunciasPage.css';

const denunciasTutorialSteps: TutorialStep[] = [
  {
    title: 'Canais oficiais',
    message:
      'Oi! Nesta tela eu te ajudo a encontrar o canal correto para registrar uma denúncia ou manifestação sobre uma obra.',
    target: '[data-tutorial="denuncias-header"]',
  },
  {
    title: 'Escolha a esfera da obra',
    message:
      'Primeiro informe se a obra é federal, estadual ou municipal. Essa escolha define para qual órgão a manifestação deve seguir.',
    target: '[data-tutorial="nivel-obra"]',
  },
  {
    title: 'Quando for municipal',
    message:
      'Se a obra for municipal, a tela abre a busca de cidade. Assim você encontra o canal da prefeitura certa ou a promotoria de apoio.',
    target: '[data-tutorial="wizard-card"]',
  },
  {
    title: 'Abra o canal indicado',
    message:
      'Depois da seleção, os canais oficiais aparecem abaixo. Use o botão de acesso para abrir o portal em uma nova aba.',
    target: '[data-tutorial="wizard-card"]',
  },
  {
    title: 'Volte ao mapa quando quiser',
    message:
      'O menu Mapa leva você de volta para pesquisar obras, ajustar o raio e conferir os detalhes no portal oficial.',
    target: '[data-tutorial="nav-map"]',
  },
];

const DenunciasPage: React.FC = () => {
  const [nivelObra, setNivelObra] = useState<string>('');
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>('');
  const [buscaCidade, setBuscaCidade] = useState<string>('');

  const cidadesFiltradas = useMemo(() => {
    const termo = normalizarCidade(buscaCidade);
    if (!termo) return CIDADES_TO;

    return CIDADES_TO.filter((cidade) =>
      normalizarCidade(cidade).includes(termo)
    );
  }, [buscaCidade]);

  const handleBuscaCidadeChange = (value: string) => {
    setBuscaCidade(value);

    const termo = normalizarCidade(value);
    if (!termo) {
      setCidadeSelecionada('');
      return;
    }

    const cidadeExata = CIDADES_TO.find((cidade) => normalizarCidade(cidade) === termo);
    if (cidadeExata) {
      setCidadeSelecionada(cidadeExata);
      return;
    }

    if (cidadeSelecionada && !normalizarCidade(cidadeSelecionada).includes(termo)) {
      setCidadeSelecionada('');
    }
  };

  const getCanal = (): CanalDenuncia[] => {
    if (nivelObra === 'FEDERAL') return CANAIS_FEDERAIS;
    if (nivelObra === 'ESTADUAL') return CANAIS_ESTADUAIS;
    if (nivelObra === 'MUNICIPAL' && cidadeSelecionada) {
      const municipal = getCanalMunicipal(cidadeSelecionada);
      const mpto: CanalDenuncia = {
        nome: `Ministério Público - Promotoria de ${cidadeSelecionada}`,
        link: 'https://www.mpto.mp.br/ouvidoria/manifestation?tab=manifestation&type=anonymous',
        descricao:
          'Canal universal para denúncias anônimas em qualquer município do Tocantins. Use caso o portal da prefeitura esteja indisponível.',
      };
      return [municipal, mpto];
    }
    return [];
  };

  return (
    <Layout
      tutorialSteps={denunciasTutorialSteps}
      tutorialStorageKey="monitora-denuncias-tutorial-v1"
    >
      <div className="denuncias-page">
        <header className="denuncias-header" data-tutorial="denuncias-header">
          <div className="header-content">
            <span className="page-eyebrow">Controle social</span>
            <h1>Canais de Denúncia</h1>
            <p>Selecione a esfera da obra e encontre o canal oficial para registrar sua manifestação.</p>
          </div>
        </header>

        <section className="selection-wizard">
          <div className="wizard-card" data-tutorial="wizard-card">
            <div className="wizard-intro">
              <h2>Onde a obra está localizada?</h2>
              <p className="wizard-subtitle">
                Para direcionar sua denúncia ao órgão correto, selecione a esfera governamental responsável pela obra.
              </p>
            </div>

            <div className="wizard-controls">
              <div className="wizard-form-group">
                <label htmlFor="nivel-obra">Esfera Governamental</label>
                <div className="select-wrapper">
                  <select
                    id="nivel-obra"
                    data-tutorial="nivel-obra"
                    value={nivelObra}
                    onChange={(e) => {
                      setNivelObra(e.target.value);
                      setCidadeSelecionada('');
                    }}
                  >
                    <option value="">Selecione a esfera...</option>
                    <option value="FEDERAL">Federal (Obras da União)</option>
                    <option value="ESTADUAL">Estadual (Obras do Tocantins)</option>
                    <option value="MUNICIPAL">Municipal (Prefeituras)</option>
                  </select>
                </div>
              </div>

              {nivelObra === 'MUNICIPAL' && (
                <div className="wizard-form-group animate-in">
                  <label htmlFor="cidade-obra">Cidade do Tocantins</label>
                  <input
                    type="search"
                    className="cidade-search-input"
                    placeholder="Buscar cidade..."
                    value={buscaCidade}
                    onChange={(e) => handleBuscaCidadeChange(e.target.value)}
                  />
                  <div className="select-wrapper">
                    <select
                      id="cidade-obra"
                      value={cidadeSelecionada}
                      onChange={(e) => setCidadeSelecionada(e.target.value)}
                      disabled={cidadesFiltradas.length === 0}
                    >
                      <option value="">Selecione a cidade...</option>
                      {cidadesFiltradas.map((cidade) => (
                        <option key={cidade} value={cidade}>
                          {cidade}
                        </option>
                      ))}
                    </select>
                  </div>
                  {cidadesFiltradas.length === 0 && (
                    <p className="city-search-empty">Nenhuma cidade encontrada para essa busca.</p>
                  )}
                </div>
              )}
            </div>

            {getCanal().length > 0 && (
              <div className="results-section animate-in">
                <div className="results-header">
                  <h3>Canais de Denúncia Oficiais</h3>
                  <p>
                    Abra o portal mais adequado para o seu caso. A opção municipal inclui o portal da prefeitura e,
                    quando disponível, a promotoria.
                  </p>
                </div>

                <div className="canal-cards">
                  {getCanal().map((canal, index) => (
                    <div key={index} className="canal-card-item">
                      <div className="canal-icon">📢</div>
                      <div className="canal-info">
                        <h4>{canal.nome}</h4>
                        <p>{canal.descricao}</p>
                      </div>
                      <a href={canal.link} target="_blank" rel="noopener noreferrer" className="canal-link-button">
                        <span>Acessar canal</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="denuncias-info-footer">
          <p>
            As denúncias são ferramentas fundamentais de controle social. Ao usar os canais oficiais, sua
            manifestação segue para o órgão competente com mais rapidez e rastreabilidade.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default DenunciasPage;

function normalizarCidade(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
