/**
 * ViewModel: useDenunciaViewModel
 * Gerencia estado e lógica de denúncias
 */

import { useState, useCallback } from 'react';
import { Denuncia, DenunciaStatusEnum, CriarDenunciaInput } from '@models/Denuncia';
import { denunciaApi, ApiError } from '@services/api';

export enum EstadoCarregamento {
  OCIOSO = 'ocioso',
  CARREGANDO = 'carregando',
  SUCESSO = 'sucesso',
  ERRO = 'erro',
}

export interface UseDenunciaViewModelReturn {
  // Estado
  denuncias: Denuncia[];
  estado: EstadoCarregamento;
  erro: string | null;

  // Ações
  criarDenuncia: (input: CriarDenunciaInput) => Promise<void>;
  atualizarStatus: (denunciaId: string, novoStatus: DenunciaStatusEnum) => Promise<void>;
  limparErro: () => void;
}

export function useDenunciaViewModel(): UseDenunciaViewModelReturn {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [estado, setEstado] = useState<EstadoCarregamento>(EstadoCarregamento.OCIOSO);
  const [erro, setErro] = useState<string | null>(null);

  /**
   * Cria uma nova denúncia
   */
  const criarDenuncia = useCallback(async (input: CriarDenunciaInput) => {
    setEstado(EstadoCarregamento.CARREGANDO);
    setErro(null);

    try {
      // TODO: Fazer upload da imagem se existir
      // const imagemUrl = input.imagemUri ? await fazerUpload(input.imagemUri) : undefined;

      const novaDenuncia = await denunciaApi.criar(
        input.obraId,
        input.titulo,
        input.descricao,
        input.tipo,
        // imagemUrl,
      );

      setDenuncias((prev) => [novaDenuncia as Denuncia, ...prev]);
      setEstado(EstadoCarregamento.SUCESSO);
    } catch (err) {
      const mensagem = err instanceof ApiError ? err.message : 'Falha ao criar denúncia';
      setErro(mensagem);
      setEstado(EstadoCarregamento.ERRO);
    }
  }, []);

  /**
   * Atualiza o status de uma denúncia
   */
  const atualizarStatus = useCallback(
    async (denunciaId: string, novoStatus: DenunciaStatusEnum) => {
      setEstado(EstadoCarregamento.CARREGANDO);
      setErro(null);

      try {
        await denunciaApi.atualizarStatus(denunciaId, novoStatus);

        setDenuncias((prev) =>
          prev.map((d) => (d.id === denunciaId ? { ...d, status: novoStatus } : d)),
        );

        setEstado(EstadoCarregamento.SUCESSO);
      } catch (err) {
        const mensagem =
          err instanceof ApiError ? err.message : 'Falha ao atualizar denúncia';
        setErro(mensagem);
        setEstado(EstadoCarregamento.ERRO);
      }
    },
    [],
  );

  const limparErro = useCallback(() => {
    setErro(null);
  }, []);

  return {
    denuncias,
    estado,
    erro,
    criarDenuncia,
    atualizarStatus,
    limparErro,
  };
}
