/**
 * Arquivo de seed para PopularBanco de Dados
 * Execute com: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Iniciando seed do banco de dados...');

  // Limpar dados existentes
  await prisma.denuncia.deleteMany();
  await prisma.avaliacao.deleteMany();
  await prisma.comentario.deleteMany();
  await prisma.atualizacaoObra.deleteMany();
  await prisma.obra.deleteMany();
  await prisma.usuario.deleteMany();

  // Criar usuários
  const usuario1 = await prisma.usuario.create({
    data: {
      email: 'joao@palmas.com.br',
      senha: 'hashed_password_here',
      nome: 'João Silva',
      cpf: '12345678901',
      telefone: '6399999999',
      bairro: 'ARSE 12',
    },
  });

  const usuario2 = await prisma.usuario.create({
    data: {
      email: 'maria@palmas.com.br',
      senha: 'hashed_password_here',
      nome: 'Maria Santos',
      cpf: '98765432101',
      telefone: '6398888888',
      bairro: '104 Sul',
    },
  });

  // Criar obras
  const obra1 = await prisma.obra.create({
    data: {
      titulo: 'Asfaltamento na ARSE 14',
      descricao: 'Recuperação de pavimentação e drenagem',
      tipo: 'Asfaltamento',
      latitude: -10.21759,
      longitude: -48.30251,
      endereco: 'ARSE 14, Palmas - TO',
      bairro: 'ARSE 14',
      status: 'EM_EXECUCAO',
      dataInicio: new Date('2024-01-15'),
      dataFimPrevista: new Date('2024-04-15'),
      percentualProgresso: 45,
      orcamentoEstimado: 250000,
    },
  });

  const obra2 = await prisma.obra.create({
    data: {
      titulo: 'Sistema de Drenagem no Aureny IV',
      descricao: 'Implantação de sistema de drenagem de águas pluviais',
      tipo: 'Drenagem',
      latitude: -10.22348,
      longitude: -48.28945,
      endereco: 'Aureny IV, Palmas - TO',
      bairro: 'Aureny IV',
      status: 'EM_EXECUCAO',
      dataInicio: new Date('2024-02-01'),
      dataFimPrevista: new Date('2024-05-30'),
      percentualProgresso: 30,
      orcamentoEstimado: 180000,
    },
  });

  const obra3 = await prisma.obra.create({
    data: {
      titulo: 'Construção da UPA em Taquaralto',
      descricao: 'Construção de nova Unidade de Pronto Atendimento',
      tipo: 'Construção',
      latitude: -10.19456,
      longitude: -48.35678,
      endereco: 'Taquaralto, Palmas - TO',
      bairro: 'Taquaralto',
      status: 'PLANEJADA',
      dataInicio: new Date('2024-04-01'),
      dataFimPrevista: new Date('2025-02-01'),
      percentualProgresso: 0,
      orcamentoEstimado: 1500000,
    },
  });

  // Criar denúncias
  await prisma.denuncia.create({
    data: {
      usuarioId: usuario1.id,
      obraId: obra1.id,
      titulo: 'Obra atrasada',
      descricao: 'A obra deveria ter avançado mais nos últimos dias. Máquinas paradas.',
      tipo: 'ATRASO',
      status: 'ABERTA',
    },
  });

  await prisma.denuncia.create({
    data: {
      usuarioId: usuario2.id,
      obraId: obra2.id,
      titulo: 'Falta de sinalização',
      descricao: 'Área de obra sem sinalização adequada. Risco de acidentes.',
      tipo: 'SEGURANCA',
      status: 'EM_ANALISE',
    },
  });

  // Criar atualizações
  await prisma.atualizacaoObra.create({
    data: {
      obraId: obra1.id,
      descricao: 'Início da fase de compactação do solo',
      novoStatus: 'EM_EXECUCAO',
      novoPercentual: 45,
    },
  });

  console.log('✓ Seed completo!');
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('✗ Erro ao fazer seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
