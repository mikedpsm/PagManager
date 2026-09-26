import { ChargesCard } from '.';
import { mock } from './mock';


export default {
  title: 'ChargesCard',
  component: ChargesCard,
  args: {
    charges: mock,
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <ChargesCard {...args} />
    </div>
  );
};
