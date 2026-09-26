import paid from '../../../assets/main/paid.svg';
import overdue from '../../../assets/main/overdue.svg';
import pending from '../../../assets/main/pending.svg';

export const colorSelector = (type) => {
  switch (type) {
    case 'Cobranças Vencidas':
      return {
        backgroundColor: '#f2d6d0',
        src: overdue,
      }
    case 'Cobranças Pagas':
      return {
        backgroundColor: '#acd9c5',
        src: paid,
      }
    case 'Cobranças Previstas':
      return {
        backgroundColor: '#f5d9b0',
        src: pending
      }
  }
}
