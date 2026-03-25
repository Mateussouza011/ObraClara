/**
 * ViewModel (Custom Hook): useObraViewModel
 * Gerencia estado e lógica relacionada a obras
 * Padrão MVVM: Separa a lógica de negócio da View
 */

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Obra, ObraStatusEnum } from '@models/Obra';
import { obraApi, ApiError } from '@services/api';

/**
 * Estados possíveis do hook
 */
export enum EstadoCarregamento {
  OCIOSO = 'ocioso',
  CARREGANDO = 'carregando',
  SUCESSO = 'sucesso',
  ERRO = 'erro',
}

/**
 * Interface de retorno do hook
 */
export interface UseObraViewModelReturn {
  // Estado
  obras: Obra[];
  estado: EstadoCarregamento;
  erro: string | null;
  localizacaoUsuario: { latitude: number; longitude: number } | null;
  raioFiltro: number;

  // Ações
  carregarObrasProximas: (raioKm?: number) => Promise<void>;
  carregarTodasObras: () => Promise<void>;
  filtrarPorStatus: (status: ObraStatusEnum) => Obra[];
  filtrarPorBairro: (bairro: string) => Obra[];
  obterObraOrdenada: (campo: 'distancia' | 'dataFimPrevista') => Obra[];
  atualizarRaioFiltro: (raioKm: number) => void;
  limparErro: () => void;
}

/**
 * useObraViewModel
 * Hook custom que encapsula toda lógica de negócio relacionada a obras
 */
export function useObraViewModel(): UseObraViewModelReturn {
  // ========== ESTADO ==========

  const [obras, setObras] = useState<Obra[]>([]);
  const [estado, setEstado] = useState<EstadoCarregamento>(EstadoCarregamento.OCIOSO);
  const [erro, setErro] = useState<string | null>(null);
  const [localizacaoUsuario, setLocalizacaoUsuario] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [raioFiltro, setRaioFiltro] = useState(10); // km

  // ========== EFEITOS ==========

  /**
   * Obtém localização do usuário ao montar
   */
  useEffect(() => {
    obterLocalizacao();
  }, []);

  /**
   * Carrega obras quando localizações muda
   */
  useEffect(() => {
    if (localizacaoUsuario) {
      carregarObrasProximas(raioFiltro);
    }
  }, [localizacaoUsuario, raioFiltro]);

  // ========== MÉTODOS PRIVADOS ==========

  /**
   * Obtém localização atual do usuário
   */
  const obterLocalizacao = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErro('Permissão de localização negada');
        return;
      }

      const localizacao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocalizacaoUsuario({
        latitude: localizacao.coords.latitude,
        longitude: localizacao.coords.longitude,
      });
    } catch (err) {
      setErro('Falha ao obter localização');
      console.error('Erro de localização:', err);
    }
  }, []);

  // ========== AÇÕES PÚBLICAS ==========

  /**
   * Carrega obras próximas à localização do usuário
   */
  const carregarObrasProximas = useCallback(
    async (raioKm: number = raioFiltro) => {
      if (!localizacaoUsuario) {
        setErro('Localização não disponível');
        return;
      }

      setEstado(EstadoCarregamento.CARREGANDO);
      setErro(null);

      try {
        const obrasCarregadas = await obraApi.listarProximas(
          localizacaoUsuario.latitude,
          localizacaoUsuario.longitude,
          raioKm,
        );

        // Calcular distâncias
        const obrasComDistancia = (obrasCarregadas as Obra[]).map((obra) => ({
          ...obra,
          distancia: calcularDistancia(
            localizacaoUsuario.latitude,
            localizacaoUsuario.longitude,
            obra.localizacao.latitude,
            obra.localizacao.longitude,
          ),
        }));

        setObras(obrasComDistancia);
        setEstado(EstadoCarregamento.SUCESSO);
      } catch (err) {
        const mensagem = err instanceof ApiError ? err.message : 'Falha ao carregar obras';
        setErro(mensagem);
        setEstado(EstadoCarregamento.ERRO);
        console.error('Erro ao carregar obras:', err);
      }
    },
    [localizacaoUsuario, raioFiltro],
  );

  /**
   * Carrega todas as obras (sem filtro de distância)
   */
  const carregarTodasObras = useCallback(async () => {
    setEstado(EstadoCarregamento.CARREGANDO);
    setErro(null);

    try {
      const obrasCarregadas = await obraApi.listarTodas();
      setObras(obrasCarregadas as Obra[]);
      setEstado(EstadoCarregamento.SUCESSO);
    } catch (err) {
      const mensagem = err instanceof ApiError ? err.message : 'Falha ao carregar obras';
      setErro(mensagem);
      setEstado(EstadoCarregamento.ERRO);
    }
  }, []);

  // ========== FILTROS ==========

  /**
   * Filtra obras por status
   */
  const filtrarPorStatus = useCallback(
    (status: ObraStatusEnum): Obra[] => {
      return obras.filter((obra) => obra.status === status);
    },
    [obras],
  );

  /**
   * Filtra obras por bairro
   */
  const filtrarPorBairro = useCallback(
    (bairro: string): Obra[] => {
      return obras.filter((obra) => obra.bairro.toLowerCase().includes(bairro.toLowerCase()));
    },
    [obras],
  );

  /**
   * Retorna obras ordenadas por um campo
   */
  const obterObraOrdenada = useCallback(
    (campo: 'distancia' | 'dataFimPrevista'): Obra[] => {
      const copia = [...obras];
      return copia.sort((a, b) => {
        if (campo === 'distancia') {
          return (a.distancia || 0) - (b.distancia || 0);
        }
        if (campo === 'dataFimPrevista') {
          const dataA = new Date(a.dataFimPrevista || 0).getTime();
          const dataB = new Date(b.dataFimPrevista || 0).getTime();
          return dataA - dataB;
        }
        return 0;
      });
    },
    [obras],
  );

  /**
   * Atualiza o raio de filtro
   */
  const atualizarRaioFiltro = useCallback((raioKm: number) => {
    setRaioFiltro(raioKm);
  }, []);

  /**
   * Limpa o estado de erro
   */
  const limparErro = useCallback(() => {
    setErro(null);
  }, []);

  return {
    obras,
    estado,
    erro,
    localizacaoUsuario,
    raioFiltro,
    carregarObrasProximas,
    carregarTodasObras,
    filtrarPorStatus,
    filtrarPorBairro,
    obterObraOrdenada,
    atualizarRaioFiltro,
    limparErro,
  };
}

/**
 * Calcula distância entre dois pontos (Fórmula de Haversine)
 */
function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100;
}
