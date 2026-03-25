/**
 * View: CriarDenunciaScreen
 * Tela para criação de denúncias com upload de imagem
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDenunciaViewModel, EstadoCarregamento } from '@viewModels/useDenunciaViewModel';
import { DenunciaTipoEnum, obterLabelTipo } from '@models/Denuncia';

export interface CriarDenunciaScreenProps {
  obraId: string;
  obraTitulo: string;
  onSucesso?: () => void;
}

export function CriarDenunciaScreen({
  obraId,
  obraTitulo,
  onSucesso,
}: CriarDenunciaScreenProps): JSX.Element {
  const { estado, erro, criarDenuncia, limparErro } = useDenunciaViewModel();

  // ========== ESTADO LOCAL ==========

  const [formulario, setFormulario] = useState({
    titulo: '',
    descricao: '',
    tipo: DenunciaTipoEnum.OUTRO as DenunciaTipoEnum,
  });

  const [imagemUri, setImagemUri] = useState<string | null>(null);

  // ========== HANDLERS ==========

  const handleSelecionarImagem = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImagemUri(result.assets[0].uri);
    }
  };

  const handleCapturarFoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImagemUri(result.assets[0].uri);
    }
  };

  const handleEnviar = async () => {
    // Validações
    if (!formulario.titulo.trim()) {
      Alert.alert('Erro', 'Digite um título para a denúncia');
      return;
    }

    if (!formulario.descricao.trim() || formulario.descricao.length < 10) {
      Alert.alert('Erro', 'A descrição deve ter pelo menos 10 caracteres');
      return;
    }

    try {
      await criarDenuncia({
        obraId,
        titulo: formulario.titulo,
        descricao: formulario.descricao,
        tipo: formulario.tipo,
        imagemUri: imagemUri || undefined,
      });

      Alert.alert('Sucesso', 'Denúncia criada com sucesso!');
      onSucesso?.();
    } catch (err) {
      Alert.alert('Erro', erro || 'Falha ao criar denúncia');
    }
  };

  const isCarregando = estado === EstadoCarregamento.CARREGANDO;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* CABEÇALHO */}
      <View style={styles.cabecalho}>
        <Text style={styles.cabecalhoTitulo}>Nova Denúncia</Text>
        <Text style={styles.cabecalhoSubtitulo}>Obra: {obraTitulo}</Text>
      </View>

      {/* FORMULÁRIO */}
      <View style={styles.formulario}>
        {/* Tipo de Denúncia */}
        <View style={styles.campo}>
          <Text style={styles.label}>Tipo de Denúncia *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tipoScroll}
          >
            {Object.values(DenunciaTipoEnum).map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.tipoBotao,
                  formulario.tipo === tipo && styles.tipoBotaoAtivo,
                ]}
                onPress={() => setFormulario({ ...formulario, tipo })}
              >
                <Text
                  style={[
                    styles.tipoBotaoText,
                    formulario.tipo === tipo && styles.tipoBotaoTextAtivo,
                  ]}
                >
                  {obterLabelTipo(tipo)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Título */}
        <View style={styles.campo}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Obra parada há dias"
            placeholderTextColor="#D1D5DB"
            value={formulario.titulo}
            onChangeText={(text) =>
              setFormulario({ ...formulario, titulo: text })
            }
            editable={!isCarregando}
          />
        </View>

        {/* Descrição */}
        <View style={styles.campo}>
          <Text style={styles.label}>Descrição *</Text>
          <TextInput
            style={[styles.input, styles.inputGrande]}
            placeholder="Descreva detalhadamente o problema ou sugestão..."
            placeholderTextColor="#D1D5DB"
            value={formulario.descricao}
            onChangeText={(text) =>
              setFormulario({ ...formulario, descricao: text })
            }
            multiline
            numberOfLines={5}
            editable={!isCarregando}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {formulario.descricao.length} caracteres
          </Text>
        </View>

        {/* Imagem */}
        <View style={styles.campo}>
          <Text style={styles.label}>Anexar Imagem (Opcional)</Text>

          {imagemUri ? (
            <View style={styles.imagemContainer}>
              <Image source={{ uri: imagemUri }} style={styles.imagem} />
              <TouchableOpacity
                style={styles.botaoRemoverImagem}
                onPress={() => setImagemUri(null)}
              >
                <Text style={styles.botaoRemoverImagemText}>Remover</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagemPlaceholder}>
              <Text style={styles.imagemPlaceholderIcon}>📸</Text>
              <Text style={styles.imagemPlaceholderText}>
                Nenhuma imagem selecionada
              </Text>
            </View>
          )}

          <View style={styles.botoesImagem}>
            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={handleCapturarFoto}
              disabled={isCarregando}
            >
              <Text style={styles.botaoSecundarioText}>📷 Câmera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={handleSelecionarImagem}
              disabled={isCarregando}
            >
              <Text style={styles.botaoSecundarioText}>🖼️ Galeria</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Erro */}
        {erro && (
          <View style={styles.erroContainer}>
            <Text style={styles.erroText}>⚠️ {erro}</Text>
            <TouchableOpacity onPress={limparErro}>
              <Text style={styles.erroLink}>Limpar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botão Enviar */}
        <TouchableOpacity
          style={[styles.botaoPrincipal, isCarregando && styles.botaoPrincipalDisabled]}
          onPress={handleEnviar}
          disabled={isCarregando}
        >
          {isCarregando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.botaoPrincipalText}>Enviar Denúncia</Text>
          )}
        </TouchableOpacity>

        {/* Aviso legal */}
        <Text style={styles.avisoCond}>
          Ao enviar, você concorda com nossa{' '}
          <Text style={styles.link}>Política de Privacidade</Text> e{' '}
          <Text style={styles.link}>Termos de Uso</Text>.
        </Text>
      </View>
    </ScrollView>
  );
}

// ========== ESTILOS ==========

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Cabeçalho
  cabecalho: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cabecalhoTitulo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  cabecalhoSubtitulo: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Formulário
  formulario: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  // Campo
  campo: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  // Input
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  inputGrande: {
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },

  // Tipo Denúncia
  tipoScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  tipoBotao: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  tipoBotaoAtivo: {
    backgroundColor: '#3B82F6',
  },
  tipoBotaoText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  tipoBotaoTextAtivo: {
    color: '#FFFFFF',
  },

  // Imagem
  imagemContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  imagem: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  botaoRemoverImagem: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  botaoRemoverImagemText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  imagemPlaceholder: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 40,
    alignItems: 'center',
    marginBottom: 12,
  },
  imagemPlaceholderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  imagemPlaceholderText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  botoesImagem: {
    flexDirection: 'row',
    gap: 8,
  },

  // Botões
  botaoPrincipal: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  botaoPrincipalDisabled: {
    opacity: 0.6,
  },
  botaoPrincipalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  botaoSecundario: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  botaoSecundarioText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },

  // Erro
  erroContainer: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  erroText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  erroLink: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },

  // Aviso
  avisoCond: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  link: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
