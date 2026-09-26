import { Nav } from '.';
import home from '../../../assets/home.svg';

const mock = [
  {
    alt: 'home',
    link: '#link1',
    src: home,
    page: 'Home 1'
  },
  {
    alt: 'home',
    link: '#link2',
    src: home,
    page: 'Home 2'
  },
  {
    alt: 'home',
    link: '#link3',
    src: home,
    page: 'Home 3'
  }
]

export default {
  title: 'Nav',
  component: Nav,
  args: {
    links: mock,
  },
};

export const Template = (args) => {
  return (
    <Nav {...args} />
  );
};
