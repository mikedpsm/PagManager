import { RegisterComplete } from '.';

export default {
  title: 'RegisterComplete',
  component: RegisterComplete,
  args: {
    children: 'RegisterComplete',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <RegisterComplete {...args} />
    </div>
  );
};
