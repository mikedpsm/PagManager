import { ClientsContainer } from '.';
import { mock } from './mock';

export default {
  title: 'ClientsContainer',
  component: ClientsContainer,
  args: {
    clients: mock,
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <ClientsContainer {...args} />
    </div>
  );
};
