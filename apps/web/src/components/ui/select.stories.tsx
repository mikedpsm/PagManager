import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

function SelectExample() {
  return (
    <Select defaultValue="pending">
      <SelectTrigger aria-label="Situação da cobrança">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pendente</SelectItem>
        <SelectItem value="paid">Paga</SelectItem>
        <SelectItem value="overdue">Em atraso</SelectItem>
      </SelectContent>
    </Select>
  );
}

const meta = { component: SelectExample, title: 'UI/Select' } satisfies Meta<
  typeof SelectExample
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Status: Story = {};
