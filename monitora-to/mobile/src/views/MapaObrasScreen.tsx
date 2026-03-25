/**
 * View: MapaObrasScreen
 * Tela que exibe obras em um mapa
 * Padrão MVVM: Usa hook ViewModel e foca apenas em renderização
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useObraViewModel, EstadoCarregamento } from '@viewModels/useObraViewModel';
import { Obra, obterLabelStatus } from '@models/Obra';

export function MapaObrasScreen(): JSX.Element {
  const {
    obras,
    estado,
    erro,
    localizacaoUsuario,
    raioFiltro,
    carregarObrasProximas,
    atualizarRaioFiltro,
    limparErro,
  } = useObraViewModel();

  // ========== RENDERIZAÇÃO CONDICIONAL ==========

  if (estado === EstadoCarregamento.CARREGANDO && !localizacaoUsuario) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Obtendo sua localização...</Text>
      </View>
    );
  }

  if (erro && !localizacaoUsuario) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>⚠️ {erro}</Text>
        <TouchableOpacity
          style={styles.botaoRetornar}
          onPress={() => {
            limparErro();
            carregarObrasProximas();
          }}
        >
          <Text style={styles.botaoText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* MAPA */}
      {localizacaoUsuario && (
        <MapView
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: localizacaoUsuario.latitude,
            longitude: localizacaoUsuario.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          style={styles.mapa}
        >
          {/* Marcador de localização do usuário */}
          <Marker
            coordinate={{
              latitude: localizacaoUsuario.latitude,
              longitude: localizacaoUsuario.longitude,
            }}
            title="Sua localização"
            pinColor="blue"
          />

          {/* Marcadores de obras */}
          {obras.map((obra) => (
            <Marker
              key={obra.id}
              coordinate={{
                latitude: obra.localizacao.latitude,
                longitude: obra.localizacao.longitude,
              }}
              title={obra.titulo}
              description={`${obra.bairro} - ${obra.percentualProgresso}%`}
            />
          ))}
        </MapView>
      )}

      {/* PAINEL DE CONTROLE - PARTE INFERIOR */}
      <View style={styles.painelControle}>
        {/* Seletor de raio */}
        <View style={styles.raioSelector}>
          <Text style={styles.raioLabel}>Raio de busca: {raioFiltro}km</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[5, 10, 15, 20, 50].map((raio) => (
              <TouchableOpacity
                key={raio}
                style={[
                  styles.raioBotao,
                  raioFiltro === raio && styles.raioBotaoAtivo,
                ]}
                onPress={() => atualizarRaioFiltro(raio)}
              >
                <Text
                  style={[
                    styles.raioBotaoText,
                    raioFiltro === raio && styles.raioBotaoTextAtivo,
                  ]}
                >
                  {raio}km
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lista de obras */}
        <View style={styles.listaObras}>
          <Text style={styles.listaTitle}>
            Obras próximas ({obras.length})
          </Text>

          {estado === EstadoCarregamento.CARREGANDO ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : obras.length > 0 ? (
            <ScrollView style={styles.scrollObras}>
              {obras.map((obra) => (
                <ObraCard key={obra.id} obra={obra} />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.semObras}>Nenhuma obra próxima encontrada</Text>
          )}
        </View>
      </View>
    </View>
  );
}

/**
 * Componente: ObraCard
 * Card que exibe informações resumidas de uma obra
 */
function ObraCard({ obra }: { obra: Obra }): JSX.Element {
  const statusColor = {
    PLANEJADA: '#9CA3AF',
    EM_EXECUCAO: '#3B82F6',
    PAUSADA: '#F59E0B',
    CONCLUIDA: '#10B981',
  }[obra.status];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitulo}>
          <Text style={styles.cardTituloText} numberOfLines={1}>
            {obra.titulo}
          </Text>
          <Text style={styles.cardBairro}>{obra.bairro}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{obterLabelStatus(obra.status)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <ProgressBar percentual={obra.percentualProgresso} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📍 Distância:</Text>
          <Text style={styles.infoValue}>
            {obra.distancia ? `${obra.distancia} km` : '-- km'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📅 Prazo:</Text>
          <Text style={styles.infoValue}>
            {obra.dataFimPrevista
              ? new Date(obra.dataFimPrevista).toLocaleDateString('pt-BR')
              : 'Não definido'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.cardBotao}>
        <Text style={styles.cardBotaoText}>Ver Detalhes</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Componente: ProgressBar
 * Barra de progresso colorida
 */
function ProgressBar({ percentual }: { percentual: number }): JSX.Element {
  const corProgresso =
    percentual < 30 ? '#EF4444' : percentual < 70 ? '#F59E0B' : '#10B981';

  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>{percentual}% concluído</Text>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${percentual}%`, backgroundColor: corProgresso },
          ]}
        />
      </View>
    </View>
  );
}

// ========== ESTILOS ==========

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // Loading/Error
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  botaoRetornar: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignSelf: 'center',
  },
  botaoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Mapa
  mapa: {
    flex: 1,
  },

  // Painel de Controle
  painelControle: {
    maxHeight: '45%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },

  // Raio Selector
  raioSelector: {
    marginBottom: 12,
  },
  raioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  raioBotao: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#E5E7EB',
  },
  raioBotaoAtivo: {
    backgroundColor: '#3B82F6',
  },
  raioBotaoText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  raioBotaoTextAtivo: {
    color: '#FFFFFF',
  },

  // Lista de Obras
  listaObras: {
    flex: 1,
  },
  listaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  scrollObras: {
    flex: 1,
  },
  semObras: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  cardTitulo: {
    flex: 1,
    marginRight: 8,
  },
  cardTituloText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardBairro: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
  cardBotao: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cardBotaoText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Progress Bar
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
