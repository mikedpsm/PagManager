import { Register1 } from '.';

export default {
  title: 'Register1Comp',
  component: Register1,
  args: {
    children: 'Register1',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <Register1 {...args} />
    </div>
  );
};
