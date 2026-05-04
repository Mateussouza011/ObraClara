import React, { useState } from 'react';
import { Layout } from '../components';
import { 
  CANAIS_FEDERAIS, 
  CANAIS_ESTADUAIS, 
  CIDADES_TO, 
  getCanalMunicipal,
  type CanalDenuncia 
} from '../models';
import './DenunciasPage.css';

const DenunciasPage: React.FC = () => {
  const [nivelObra, setNivelObra] = useState<string>('');
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>('');

  const getCanal = (): CanalDenuncia[] => {
    if (nivelObra === 'FEDERAL') return CANAIS_FEDERAIS;
    if (nivelObra === 'ESTADUAL') return CANAIS_ESTADUAIS;
    if (nivelObra === 'MUNICIPAL' && cidadeSelecionada) {
      return [getCanalMunicipal(cidadeSelecionada)];
    }
    return [];
  };

  return (
    <Layout>
      <div className="denuncias-page">
        <div className="denuncias-header">
          <div className="header-content">
            <h1>Canais de Denúncia</h1>
            <p>Selecione a esfera da obra e encontre o canal oficial para realizar sua manifestação</p>
          </div>
        </div>

        <section className="selection-wizard">
          <div className="wizard-card">
            <h2>Onde a obra está localizada?</h2>
            <p className="wizard-subtitle">Para direcionar sua denúncia ao órgão de controle correto, selecione a esfera governamental responsável pela obra.</p>
            
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
                    <option value="FEDERAL">🏛️ Federal (Obras da União)</option>
                    <option value="ESTADUAL">🏞️ Estadual (Obras do Tocantins)</option>
                    <option value="MUNICIPAL">🏘️ Municipal (Prefeituras)</option>
                  </select>
                </div>
              </div>

              {nivelObra === 'MUNICIPAL' && (
                <div className="wizard-form-group animate-in">
                  <label htmlFor="cidade-obra">Cidade do Tocantins</label>
                  <div className="select-wrapper">
                    <select 
                      id="cidade-obra" 
                      value={cidadeSelecionada} 
                      onChange={(e) => setCidadeSelecionada(e.target.value)}
                    >
                      <option value="">Selecione a cidade...</option>
                      {CIDADES_TO.map(cidade => (
                        <option key={cidade} value={cidade}>{cidade}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {getCanal().length > 0 && (
              <div className="results-section animate-in">
                <h3>Canais de Denúncia Oficiais</h3>
                <div className="canal-cards">
                  {getCanal().map((canal, index) => (
                    <div key={index} className="canal-card-item">
                      <div className="canal-icon">📢</div>
                      <div className="canal-info">
                        <h4>{canal.nome}</h4>
                        <p>{canal.descricao}</p>
                      </div>
                      <a href={canal.link} target="_blank" rel="noopener noreferrer" className="canal-link-button">
                        Acessar Canal Oficial ↗
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="denuncias-info-footer">
          <p>As denúncias são ferramentas fundamentais de controle social. Ao utilizar os canais oficiais, você garante que sua manifestação seja apurada pelos órgãos competentes.</p>
        </div>
      </div>
    </Layout>
  );
};

export default DenunciasPage;
