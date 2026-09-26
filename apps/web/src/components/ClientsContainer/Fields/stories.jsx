import { ClientFields } from '.';

export default {
  title: 'ClientFields',
  component: ClientFields,
  args: {
    client_name: 'Sarah',
    client_cpf: '153663528966',
    client_email: 'email@email.com',
    client_phone: '',
    client_status: 'Paid',
  },
};

export const Template = (args) => {
  return (
    <div>
      <ClientFields {...args} />
    </div>
  );
};
