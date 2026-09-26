import { Input } from '.';

export default {
  title: 'Input',
  component: Input,
  args: {
    children: 'Input',
    label: 'Input',
    fgtPassword: true
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <Input {...args} />
    </div>
  );
};
