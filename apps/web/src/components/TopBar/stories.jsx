import { TopBar } from '.';
import arrow from '../../assets/arrow-down.svg'


export default {
  title: 'TopBar',
  component: TopBar,
  args: {
    page: 'Início',
    aka: 'JX',
    name: 'Jonatas Ximenez',
  },
};

export const Template = (args) => {
  return (
    <div>
      <TopBar {...args} />
    </div>
  );
};
