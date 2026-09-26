import { ClientPage } from '.';
import mock from './mock';

export default {
  title: 'ClientPage',
  component: ClientPage,
  args: {
    client: {
      id: 1,
      user_id: 7,
      name: "Estel Leffler",
      email: "ada.gislason@example.org",
      cpf: "19150658866",
      phone: "13156869794",
      address: "57679 Jerry Turnpike",
      complement: "eius eos ut",
      cep: "56082340",
      neighborhood: "nesciunt rem inventore",
      city: "Hollybury",
      state: "vw",
      created_at: "2023-02-13T17:53:51.000000Z",
      updated_at: "2023-02-13T17:53:51.000000Z"
    }
  },
};

export const Template = (args) => {
  return (
    <div>
      <ClientPage {...args} />
    </div>
  );
};
