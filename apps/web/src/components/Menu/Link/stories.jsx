import { Link } from '.';
import homeSelected from '../../../assets/home.svg'

export default {
  title: 'Link',
  component: Link,
  args: {
    src: homeSelected,
    alt: 'home',
    link: '#home',
    page: 'Home'
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <Link {...args} />
  );
};
