import { ProgressBar } from '.';

export default {
  title: 'ProgressBar',
  component: ProgressBar,
  args: {
    stg: 3,
  },
};

export const Template = (args) => {
  return (
    <div>
      <ProgressBar {...args} />
    </div>
  );
};
