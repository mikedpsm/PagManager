import { MiddleDiv } from '.';

export default {
  title: 'MiddleDiv',
  component: MiddleDiv,
  args: {
    page: 'Clientes',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <MiddleDiv {...args} />
    </div>
  );
};
