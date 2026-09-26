import { Button } from '.';

export default {
  title: 'Button',
  component: Button,
  args: {
    children: 'Button',
    type: 'submit',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <Button {...args} />
    </div>
  );
};
