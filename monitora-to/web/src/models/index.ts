/**
 * Índice de Models
 */

export * from './Obra';
export * from './CanaisDenuncia';
export {
	DenunciaStatusEnum,
	DenunciaTipoEnum,
	type Denuncia,
	type CriarDenunciaDTO,
	statusColor as denunciaStatusColor,
	statusLabel as denunciaStatusLabel,
} from './Denuncia';
