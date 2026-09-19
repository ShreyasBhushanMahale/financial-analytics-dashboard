import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import { Button } from '@mui/material';
import { useState } from 'react';
import type { SortField, SortOrder } from '../../types/api';
import type { TransactionFilters } from '../../utils/filterParams';
import { ExportDialog } from './ExportDialog';

interface ExportButtonProps {
  filters: TransactionFilters;
  hasFilters: boolean;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export function ExportButton(props: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        startIcon={<FileDownloadOutlined />}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        sx={{ whiteSpace: 'nowrap' }}
      >
        Export CSV
      </Button>
      <ExportDialog open={open} onClose={() => setOpen(false)} {...props} />
    </>
  );
}
