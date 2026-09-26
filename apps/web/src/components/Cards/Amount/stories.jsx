import { AmountCard } from '.';
import paid from '../../../assets/main/paid.svg';

export default {
  title: 'AmountCard',
  component: AmountCard,
  args: {
    amount: 0,
    name: 'Cobranças',
    src: paid,
    color: '#acd9c5',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <AmountCard {...args} />
    </div>
  );
};
