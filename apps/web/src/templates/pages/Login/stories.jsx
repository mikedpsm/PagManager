import { LoginPage } from '.';

export default {
  title: 'LoginPage',
  component: LoginPage,
  args: {
    children: 'LoginPage',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <LoginPage {...args} />
  );
};
