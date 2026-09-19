import { useQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { AxiosError, type AxiosAdapter } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { http } from '../api/http';
import { AppProviders } from '../providers/AppProviders';

const realAdapter = http.defaults.adapter;

afterEach(() => {
  http.defaults.adapter = realAdapter;
});

/** Stands in for the network: every request gets the error response our API sends. */
const failingApi: AxiosAdapter = (config) =>
  Promise.reject(
    new AxiosError(
      'Request failed with status code 400',
      AxiosError.ERR_BAD_REQUEST,
      config,
      null,
      {
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config,
        data: {
          error: { code: 'VALIDATION_ERROR', message: 'dateTo: must be on or after dateFrom' },
        },
      },
    ),
  );

function ComponentThatLoadsData() {
  useQuery({ queryKey: ['transactions'], queryFn: () => http.get('/transactions') });
  return null;
}

describe('API errors', () => {
  it('appear as an alert chip with the message the server sent', async () => {
    http.defaults.adapter = failingApi;

    render(
      <AppProviders>
        <ComponentThatLoadsData />
      </AppProviders>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'dateTo: must be on or after dateFrom',
    );
  });
});
