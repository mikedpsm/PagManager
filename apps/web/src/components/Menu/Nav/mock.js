import home from '../../../assets/home.svg';
import homeSelected from '../../../assets/home-selected.svg';
import client from '../../../assets/clients.svg';
import clientSelected from '../../../assets/clients-selected.svg';
import charge from '../../../assets/charge.svg';
import chargeSelected from '../../../assets/charge-selected.svg';

export const mock = [
  {
    primarySVG: home,
    secondarySVG: homeSelected,
    link: '/home',
    alt: 'home',
    page: 'Início',
  },
  {
    primarySVG: client,
    secondarySVG: clientSelected,
    link: '/clients',
    alt: 'client',
    page: 'Clientes',
  },
  {
    primarySVG: charge,
    secondarySVG: chargeSelected,
    link: '/charges',
    alt: 'charge',
    page: 'Cobranças',
  },
]
