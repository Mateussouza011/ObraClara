/**
 * Hook: useObraViewModel
 * Gerencia estado de obras e interações com API
 */

import { useState, useEffect, useCallback } from 'react';
import { Obra } from '@models/Obra';
import { APIClient } from '@services/api';

const LOCALIZACAO_PADRAO = {
  latitude: -10.2,
  longitude: -48.3,
};

const ULTIMA_LOCALIZACAO_KEY = 'monitora-to:last-location';
const TARGET_ACCURACY_METERS = 30;
const HIGH_ACCURACY_TIMEOUT_MS = 15000;
const WATCH_REFINEMENT_TIMEOUT_MS = 12000;

function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function getRefinedPosition(initialBest: GeolocationPosition): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    let best = initialBest;

    const cleanup = (watchId: number, timerId: number) => {
      navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timerId);
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (position.coords.accuracy < best.coords.accuracy) {
          best = position;
        }

        if (best.coords.accuracy <= TARGET_ACCURACY_METERS) {
          cleanup(watchId, timeoutId);
          resolve(best);
        }
      },
      () => {
        cleanup(watchId, timeoutId);
        reject(new Error('Falha ao refinar localização'));
      },
      {
        enableHighAccuracy: true,
        timeout: HIGH_ACCURACY_TIMEOUT_MS,
        maximumAge: 0,
      }
    );

    const timeoutId = window.setTimeout(() => {
      cleanup(watchId, timeoutId);
      resolve(best);
    }, WATCH_REFINEMENT_TIMEOUT_MS);
  });
}

export function useObraViewModel(raioConsultaKm?: number) {
  const apiClient = APIClient.getInstance();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localizacao, setLocalizacao] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [precisaoMetros, setPrecisaoMetros] = useState<number | null>(null);
  const [raioFiltro, setRaioFiltro] = useState(2);
  const raioBuscaKm = raioConsultaKm ?? raioFiltro;

  // Obter localização do usuário
  useEffect(() => {
    obterLocalizacao();
  }, []);

  // Carregar obras próximas quando localização mudar (com debounce para o raio)
  useEffect(() => {
    if (!localizacao) return;

    const timer = setTimeout(() => {
      carregarObrasProximas();
    }, 500);

    return () => clearTimeout(timer);
  }, [localizacao, raioBuscaKm]);

  const obterLocalizacao = useCallback(async () => {
    try {
      setLoading(true);
      if (!navigator.geolocation) {
        setError('Geolocalização não suportada neste navegador');
        setLocalizacao(LOCALIZACAO_PADRAO);
        setPrecisaoMetros(null);
        return;
      }

      let position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: HIGH_ACCURACY_TIMEOUT_MS,
        maximumAge: 0,
      });

      if (position.coords.accuracy > TARGET_ACCURACY_METERS) {
        try {
          position = await getRefinedPosition(position);
        } catch {
          // Mantém a melhor precisão já obtida no primeiro ponto.
        }
      }

      const proximaLocalizacao = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setError(null);
      setLocalizacao(proximaLocalizacao);
      setPrecisaoMetros(position.coords.accuracy);
      localStorage.setItem(ULTIMA_LOCALIZACAO_KEY, JSON.stringify(proximaLocalizacao));
    } catch {
      const ultimaLocalizacao = localStorage.getItem(ULTIMA_LOCALIZACAO_KEY);

      if (ultimaLocalizacao) {
        try {
          const localizacaoSalva = JSON.parse(ultimaLocalizacao);
          if (
            typeof localizacaoSalva?.latitude === 'number' &&
            typeof localizacaoSalva?.longitude === 'number'
          ) {
            setError('Usando última localização salva');
            setLocalizacao(localizacaoSalva);
            setPrecisaoMetros(null);
            return;
          }
        } catch {
          // Ignora localização salva inválida e usa fallback padrão.
        }
      }

      setError('Não foi possível obter localização precisa. Exibindo centro de TO.');
      setLocalizacao(LOCALIZACAO_PADRAO);
      setPrecisaoMetros(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarObrasProximas = useCallback(async () => {
    if (!localizacao) return;

    try {
      setLoading(true);
      setError(null);
      const obrasNaProximidade = await apiClient.listarObrasProximas(
        localizacao.latitude,
        localizacao.longitude,
        raioBuscaKm
      );

      // Adicionar distância calculada para cada obra
      const obrasComDistancia = obrasNaProximidade.map((obra) => ({
        ...obra,
        distancia: calcularDistancia(
          localizacao.latitude,
          localizacao.longitude,
          obra.latitude,
          obra.longitude
        ),
      }));

      setObras(obrasComDistancia);
    } catch (err: any) {
      setError(
        err.message || 'Erro ao carregar obras'
      );
    } finally {
      setLoading(false);
    }
  }, [localizacao, raioBuscaKm]);

  const filtrarPorStatus = useCallback(
    (status: string) => {
      return obras.filter((obra) => obra.status === status);
    },
    [obras]
  );

  const obterObraOrdenada = useCallback(
    (campo: 'distancia' | 'titulo' | 'dataFimPrevista') => {
      return [...obras].sort((a, b) => {
        if (campo === 'distancia') {
          return (a as any).distancia - (b as any).distancia;
        }
        if (campo === 'titulo') {
          return a.titulo.localeCompare(b.titulo);
        }
        if (campo === 'dataFimPrevista') {
          return (
            new Date(a.dataFimPrevista || 0).getTime() -
            new Date(b.dataFimPrevista || 0).getTime()
          );
        }
        return 0;
      });
    },
    [obras]
  );

  return {
    obras,
    loading,
    error,
    localizacao,
    precisaoMetros,
    raioFiltro,
    setRaioFiltro,
    carregarObrasProximas,
    filtrarPorStatus,
    obterObraOrdenada,
  };
}

/**
 * Calcula distância em km entre dois pontos (Haversine)
 */
function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(valor: number): number {
  return (valor * Math.PI) / 180;
}
