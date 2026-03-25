/**
 * Hook: useDenunciaViewModel
 * Gerencia criação e listagem de denúncias
 */

import { useState, useCallback } from 'react';
import { Denuncia, CriarDenunciaDTO } from '@models/Denuncia';
import { APIClient } from '@services/api';

export function useDenunciaViewModel() {
  const apiClient = APIClient.getInstance();
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const criarDenuncia = useCallback(
    async (input: CriarDenunciaDTO) => {
      try {
        setLoading(true);
        setError(null);
        setSucesso(null);

        // Validações
        if (!input.titulo || input.titulo.length < 5) {
          throw new Error('Título deve ter pelo menos 5 caracteres');
        }

        if (!input.descricao || input.descricao.length < 10) {
          throw new Error('Descrição deve ter pelo menos 10 caracteres');
        }

        if (!input.tipo) {
          throw new Error('Tipo de denúncia é obrigatório');
        }

        // Enviar para API
        const novaDenuncia = await apiClient.criarDenuncia(input);

        if (novaDenuncia) {
          setSucesso('Denúncia criada com sucesso!');
          setDenuncias([novaDenuncia, ...denuncias]);
          return novaDenuncia;
        } else {
          throw new Error('Erro ao criar denúncia');
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao criar denúncia');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [denuncias]
  );

  const carregarDenuncias = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const listadenuncias = await apiClient.listarDenuncias();
      setDenuncias(listadenuncias);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar denúncias');
    } finally {
      setLoading(false);
    }
  }, []);

  const atualizarStatus = useCallback(
    async (id: string, novoStatus: string) => {
      try {
        setLoading(true);
        const denunciaAtualizada = await apiClient.atualizarStatusDenuncia(
          id,
          novoStatus
        );

        if (denunciaAtualizada) {
          setDenuncias(
            denuncias.map((d) => (d.id === id ? denunciaAtualizada : d))
          );
          setSucesso('Status atualizado com sucesso!');
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao atualizar status');
      } finally {
        setLoading(false);
      }
    },
    [denuncias]
  );

  return {
    denuncias,
    loading,
    error,
    sucesso,
    criarDenuncia,
    carregarDenuncias,
    atualizarStatus,
  };
}
