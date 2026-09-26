import { EditRegister } from '.';

export default {
  title: 'EditRegister',
  component: EditRegister,
  args: {
    children: 'EditRegister',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <EditRegister {...args} />
    </div>
  );
};
