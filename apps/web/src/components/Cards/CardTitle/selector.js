import defaulter from '../../../assets/main/defaulter-client.svg';
import loyal from '../../../assets/main/loyal-client.svg';

export const colorSelector = (type) => {
  if (type === 'Cobranças Vencidas')
    return {
      backgroundColor: '#f2d6d0',
      color: '#ae1100',
      src: null,
    }
  if (type === 'Cobranças Pagas')
    return {
      backgroundColor: '#acd9c5',
      color: '#0e8750',
      src: null,
    }
  if (type === 'Cobranças Previstas')
    return {
      backgroundColor: '#f5d9b0',
      color: '#ef8f00',
      src: null,
      }
  if (type === 'Clientes Inadimplentes')
    return {
      backgroundColor: '#f2d6d0',
      color: '#ae1100',
      src: defaulter,
    }
  if (type === 'Clientes Em Dia')
    return {
      backgroundColor: '#acd9c5',
      color: '#0e8750',
      src: loyal
    }
}

