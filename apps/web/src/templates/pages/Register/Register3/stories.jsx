import { Register3 } from '.';

export default {
  title: 'Register3',
  component: Register3,
  args: {
    children: 'Register3',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <Register3 {...args} />
    </div>
  );
};
