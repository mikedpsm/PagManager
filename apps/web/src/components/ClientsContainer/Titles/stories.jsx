import { ClientTitles } from '.';
import { mock } from '../mock';

export default {
  title: 'ClientTitles',
  component: ClientTitles,
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
      <ClientTitles {...args} />
    </div>
  );
};
