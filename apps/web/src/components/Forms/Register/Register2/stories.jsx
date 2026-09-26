import { Register2 } from '.';

export default {
  title: 'Register2Comp',
  component: Register2,
  args: {
    children: 'Register2',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <Register2 {...args} />
    </div>
  );
};
