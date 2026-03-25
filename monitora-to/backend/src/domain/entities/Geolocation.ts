/**
 * Value Object Geolocation
 * Encapsula as coordenadas geográficas (latitude e longitude)
 */

export interface IGeolocationProps {
  latitude: number;
  longitude: number;
}

export class Geolocation {
  readonly latitude: number;
  readonly longitude: number;

  constructor(props: IGeolocationProps) {
    this.validateCoordinates(props);
    this.latitude = props.latitude;
    this.longitude = props.longitude;
  }

  private validateCoordinates(props: IGeolocationProps): void {
    if (props.latitude < -90 || props.latitude > 90) {
      throw new Error('Latitude deve estar entre -90 e 90');
    }

    if (props.longitude < -180 || props.longitude > 180) {
      throw new Error('Longitude deve estar entre -180 e 180');
    }
  }

  /**
   * Calcula a distância em km entre duas coordenadas (Fórmula de Haversine)
   */
  distanciaAte(outra: Geolocation): number {
    const R = 6371; // Raio da Terra em km
    const dLat = (outra.latitude - this.latitude) * (Math.PI / 180);
    const dLon = (outra.longitude - this.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.latitude * (Math.PI / 180)) *
        Math.cos(outra.latitude * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 100) / 100;
  }

  /**
   * Verifica se está próxima (dentro de X km)
   */
  estaProxima(outra: Geolocation, distanciaMaxKm: number = 5): boolean {
    return this.distanciaAte(outra) <= distanciaMaxKm;
  }

  equals(outro: Geolocation): boolean {
    return this.latitude === outro.latitude && this.longitude === outro.longitude;
  }

  toString(): string {
    return `${this.latitude},${this.longitude}`;
  }
}
