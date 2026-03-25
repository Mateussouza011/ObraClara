import React, { useState } from 'react';
import { useDenunciaViewModel } from '../hooks';
import { Layout } from '../components';
import { DenunciaTipoEnum } from '../models';
import './DenunciasPage.css';

const DenunciasPage: React.FC = () => {
  const viewModel = useDenunciaViewModel();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: DenunciaTipoEnum.ATRASO,
  });

  React.useEffect(() => {
    viewModel.carregarDenuncias();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await viewModel.criarDenuncia({
        titulo: formData.titulo,
        descricao: formData.descricao,
        tipo: formData.tipo,
        obraId: 'obra-1',
        usuarioId: 'usuario-web',
      });

      // Limpar formulário
      setFormData({
        titulo: '',
        descricao: '',
        tipo: DenunciaTipoEnum.ATRASO,
      });
      setShowForm(false);

      // Recarregar denúncias
      await viewModel.carregarDenuncias();
    } catch (err) {
      console.error('Erro ao criar denúncia:', err);
    }
  };

  const getTipoLabel = (tipo: DenunciaTipoEnum): string => {
    switch (tipo) {
      case DenunciaTipoEnum.ATRASO:
        return '⏱️ Atraso';
      case DenunciaTipoEnum.QUALIDADE:
        return '⚠️ Qualidade';
      case DenunciaTipoEnum.SEGURANCA:
        return '🛡️ Segurança';
      case DenunciaTipoEnum.OUTRO:
        return '📌 Outro';
      default:
        return tipo;
    }
  };

  const getTipoClass = (tipo: DenunciaTipoEnum): string => {
    switch (tipo) {
      case DenunciaTipoEnum.ATRASO:
        return 'atraso';
      case DenunciaTipoEnum.QUALIDADE:
        return 'qualidade';
      case DenunciaTipoEnum.SEGURANCA:
        return 'seguranca';
      default:
        return 'outro';
    }
  };

  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'ABERTA':
        return 'aberta';
      case 'EM_ANALISE':
        return 'em-analise';
      case 'RESOLVIDA':
        return 'resolvido';
      case 'REJEITADA':
        return 'rejeitada';
      default:
        return 'aberta';
    }
  };

  return (
    <Layout>
      <div className="denuncias-page">
        <div className="denuncias-header">
          <div className="header-content">
            <h1>Denúncias</h1>
            <p>Reporte problemas e acompanhe o status das denúncias</p>
          </div>
          <button
            className="new-denuncia-button"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancelar' : '+ Nova Denúncia'}
          </button>
        </div>

        {showForm && (
          <form className="denuncia-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="titulo">Título *</label>
              <input
                id="titulo"
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Descreva o problema de forma concisa"
                disabled={viewModel.loading}
                required
              />
              {formData.titulo.length > 0 && (
                <span className="char-count">{formData.titulo.length}/100</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="descricao">Descrição Detalhada *</label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Forneça detalhes sobre o problema encontrado"
                rows={5}
                disabled={viewModel.loading}
                required
              />
              {formData.descricao.length > 0 && (
                <span className="char-count">{formData.descricao.length}/500</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="tipo">Tipo de Denúncia *</label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                disabled={viewModel.loading}
                required
              >
                <option value={DenunciaTipoEnum.ATRASO}>⏱️ Atraso na obra</option>
                <option value={DenunciaTipoEnum.QUALIDADE}>⚠️ Problemas de qualidade</option>
                <option value={DenunciaTipoEnum.SEGURANCA}>🛡️ Problemas de segurança</option>
                <option value={DenunciaTipoEnum.OUTRO}>📌 Outro</option>
              </select>
            </div>

            {viewModel.error && (
              <div className="error-message">{viewModel.error}</div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={viewModel.loading}
            >
              {viewModel.loading ? 'Enviando...' : 'Enviar Denúncia'}
            </button>
          </form>
        )}

        {viewModel.sucesso && (
          <div className="success-message">
            ✓ Denúncia criada com sucesso!
          </div>
        )}

        <div className="denuncias-list">
          {viewModel.loading && viewModel.denuncias.length === 0 && (
            <div className="loading-state">Carregando denúncias...</div>
          )}

          {!viewModel.loading && viewModel.denuncias.length === 0 && (
            <div className="empty-state">
              <p>Nenhuma denúncia registrada ainda.</p>
              <p>Clique em "Nova Denúncia" para denunciar um problema.</p>
            </div>
          )}

          {viewModel.denuncias.map((denuncia) => (
            <div key={denuncia.id} className="denuncia-card">
              <div className="denuncia-header-card">
                <div className="denuncia-title-section">
                  <h3>{denuncia.titulo}</h3>
                  <span className={`tipo-badge tipo-${getTipoClass(denuncia.tipo)}`}>
                    {getTipoLabel(denuncia.tipo)}
                  </span>
                </div>
                <span className={`status-badge status-${getStatusClass(denuncia.status)}`}>
                  {denuncia.status}
                </span>
              </div>

              <p className="denuncia-description">{denuncia.descricao}</p>

              <div className="denuncia-meta">
                <span className="meta-item">
                  <strong>Data:</strong> {new Date(denuncia.createdAt).toLocaleDateString('pt-BR')}
                </span>
                <span className="meta-item">
                  <strong>ID:</strong> #{denuncia.id.substring(0, 8)}
                </span>
              </div>

              <div className="denuncia-actions">
                <button className="action-button view">👁️ Ver Detalhes</button>
                <button className="action-button follow">🔔 Acompanhar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default DenunciasPage;
