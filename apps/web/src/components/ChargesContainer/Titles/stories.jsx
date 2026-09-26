import { ChargesTitles } from '.';
import { mock } from '../mock';

export default {
  title: 'ChargesTitles',
  component: ChargesTitles,
  args: {
    client: mock,
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <ChargesTitles {...args} />
    </div>
  );
};
