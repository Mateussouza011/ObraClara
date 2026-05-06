import React, { useMemo, useState } from 'react';
import { Layout } from '../components';
import {
  CANAIS_FEDERAIS,
  CANAIS_ESTADUAIS,
  CIDADES_TO,
  getCanalMunicipal,
  type CanalDenuncia,
} from '../models';
import './DenunciasPage.css';

const DenunciasPage: React.FC = () => {
  const [nivelObra, setNivelObra] = useState<string>('');
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>('');
  const [buscaCidade, setBuscaCidade] = useState<string>('');

  const cidadesFiltradas = useMemo(() => {
    const termo = buscaCidade.trim().toLowerCase();
    if (!termo) return CIDADES_TO;

    return CIDADES_TO.filter((cidade) =>
      cidade
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .includes(
          termo
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
        )
    );
  }, [buscaCidade]);

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
    <Layout>
      <div className="denuncias-page">
        <header className="denuncias-header">
          <div className="header-content">
            <span className="page-eyebrow">Controle social</span>
            <h1>Canais de Denúncia</h1>
            <p>Selecione a esfera da obra e encontre o canal oficial para registrar sua manifestação.</p>
          </div>

          <div className="header-panel">
            <div className="header-panel-item">
              <span className="header-panel-label">Esfera</span>
              <strong>Federal, Estadual ou Municipal</strong>
            </div>
            <div className="header-panel-item">
              <span className="header-panel-label">Destino</span>
              <strong>Canal oficial da gestão</strong>
            </div>
          </div>
        </header>

        <section className="selection-wizard">
          <div className="wizard-card">
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
                    onChange={(e) => setBuscaCidade(e.target.value)}
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
