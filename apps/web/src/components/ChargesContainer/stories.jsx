import { ChargesContainer } from '.';
import { mock } from './mock';

export default {
  title: 'ChargesContainer',
  component: ChargesContainer,
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
      <ChargesContainer {...args} />
    </div>
  );
};
