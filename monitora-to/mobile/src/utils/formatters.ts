/**
 * Utilitários de formatação e validação
 */

/**
 * Formata uma data para formato brasileiro
 */
export function formatarDataBR(data: Date | string): string {
  const dataObj = typeof data === 'string' ? new Date(data) : data;
  return dataObj.toLocaleDateString('pt-BR');
}

/**
 * Formata uma data com hora
 */
export function formatarDataHoraBR(data: Date | string): string {
  const dataObj = typeof data === 'string' ? new Date(data) : data;
  return dataObj.toLocaleString('pt-BR');
}

/**
 * Formata moeda em R$
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Valida email
 */
export function isEmailValido(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida CPF (formato básico)
 */
export function isCPFValido(cpf: string): boolean {
  const apenasNumeros = cpf.replace(/\D/g, '');
  return apenasNumeros.length === 11;
}

/**
 * Trunca texto em número de caracteres
 */
export function truncarTexto(texto: string, limite: number = 100): string {
  if (texto.length <= limite) return texto;
  return texto.substring(0, limite) + '...';
}

/**
 * Calcula tempo decorrido em texto amigável (ex: "há 2 horas")
 */
export function tempoDecorrido(data: Date | string): string {
  const dataObj = typeof data === 'string' ? new Date(data) : data;
  const agora = new Date();
  const diferenca = agora.getTime() - dataObj.getTime();

  const segundos = Math.floor(diferenca / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (dias > 0) return `há ${dias} dia${dias > 1 ? 's' : ''}`;
  if (horas > 0) return `há ${horas} hora${horas > 1 ? 's' : ''}`;
  if (minutos > 0) return `há ${minutos} minuto${minutos > 1 ? 's' : ''}`;
  return 'agora mesmo';
}

/**
 * Remove caracteres especiais
 */
export function removerCaracteresEspeciais(texto: string): string {
  return texto.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Capitalize primeira letra de cada palavra
 */
export function capitalize(texto: string): string {
  return texto
    .split(' ')
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
    .join(' ');
}
