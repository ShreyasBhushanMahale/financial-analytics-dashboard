import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { AxiosAdapter } from 'axios';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { http } from '../api/http';
import { ExportButton } from '../components/export/ExportButton';
import { AppProviders } from '../providers/AppProviders';

const realAdapter = http.defaults.adapter;

/** Answers the two requests the dialog makes: the column list and the preview/row count. */
const fakeApi: AxiosAdapter = (config) => {
  const data =
    config.url === '/transactions/export/columns'
      ? {
          columns: [
            { key: 'id', label: 'ID' },
            { key: 'date', label: 'Date (UTC)' },
            { key: 'amount', label: 'Amount' },
          ],
        }
      : {
          data: [
            {
              id: 24,
              date: '2024-12-23T17:05:03.000Z',
              amount: 2100,
              category: 'Expense',
              status: 'Paid',
              user_id: 'user_004',
              user_profile: 'https://thispersondoesnotexist.com/',
            },
          ],
          meta: { page: 1, pageSize: 3, total: 300, totalPages: 100 },
        };
  return Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
};

beforeEach(() => {
  http.defaults.adapter = fakeApi;
  localStorage.clear();
});

afterEach(() => {
  http.defaults.adapter = realAdapter;
});

describe('Export dialog', () => {
  it('disables Export once every column is deselected', async () => {
    render(
      <AppProviders>
        <ExportButton filters={{}} hasFilters={false} sortBy="date" sortOrder="desc" />
      </AppProviders>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    const dialog = await screen.findByRole('dialog');
    const exportButton = within(dialog).getByRole('button', { name: 'Export CSV' });

    // With the columns and row count loaded, every column starts selected and Export is live.
    await waitFor(() => expect(exportButton).toBeEnabled());

    fireEvent.click(within(dialog).getByRole('button', { name: 'None' }));

    expect(exportButton).toBeDisabled();
    expect(within(dialog).getByRole('status')).toHaveTextContent('Choose at least one column.');
  });
});
