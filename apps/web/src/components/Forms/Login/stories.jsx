import { LoginForm } from '.';

export default {
  title: 'LoginForm',
  component: LoginForm,
  args: {
    children: 'LoginForm',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <LoginForm {...args} />
  );
};
