import { Feedback } from '.';

export default {
  title: 'Feedback',
  component: Feedback,
  args: {
    type: 'success',
    message: 'Cadastro realizado com Sucesso',
  },

};

export const Template = (args) => {
  return (
    <div>
      <Feedback {...args} />
    </div>
  );
};
