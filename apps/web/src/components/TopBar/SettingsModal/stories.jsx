import { SettingsModal } from '.';

export default {
  title: 'SettingsModal',
  component: SettingsModal,
  args: {
    children: 'SettingsModal',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <SettingsModal {...args} />
    </div>
  );
};
