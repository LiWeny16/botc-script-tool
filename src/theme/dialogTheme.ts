// Mirrors LetShare's shared dialog surface and inner-scroll pattern with this app's compact tokens.
export const dialogComponentTheme = {
  MuiDialog: {
    defaultProps: {
      disableScrollLock: true,
    },
    styleOverrides: {
      root: {
        '& .MuiDialog-paper': {
          margin: 16,
          maxHeight: 'calc(100% - 32px)',
          overflow: 'hidden',
        },
      },
      backdrop: {
        backgroundColor: 'rgba(18, 24, 35, 0.42)',
      },
      paper: {
        borderRadius: '8px !important',
        border: 0,
        backgroundColor: '#FCFCFC',
        backgroundImage: 'none',
        boxShadow: '0 24px 64px rgba(20, 28, 42, 0.18), 0 4px 16px rgba(20, 28, 42, 0.08)',
        '&.MuiDialog-paperFullScreen': {
          margin: 0,
          maxHeight: '100%',
          borderRadius: '0 !important',
        },
        '@media (max-width: 599.95px)': {
          margin: 12,
          maxHeight: 'calc(100% - 24px)',
          '&.MuiDialog-paperFullWidth:not(.MuiDialog-paperFullScreen)': {
            width: 'calc(100% - 24px)',
          },
        },
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        padding: '20px 24px 12px',
        fontSize: '1.125rem',
        fontWeight: 700,
        lineHeight: 1.3,
        '@media (max-width: 599.95px)': {
          padding: '16px 16px 10px',
        },
      },
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: {
        minHeight: 0,
        padding: '16px 24px',
        overflowX: 'hidden',
        overscrollBehavior: 'contain',
        '@media (max-width: 599.95px)': {
          padding: '14px 16px',
        },
      },
    },
  },
  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: '16px 24px',
        gap: 8,
        flexWrap: 'wrap',
        '& .MuiButton-root': {
          minHeight: 40,
          borderRadius: 6,
          textTransform: 'none',
          boxShadow: 'none',
        },
        '@media (max-width: 599.95px)': {
          padding: '14px 16px',
        },
      },
    },
  },
  MuiDialogContentText: {
    styleOverrides: {
      root: {
        fontSize: '0.875rem',
        lineHeight: 1.65,
      },
    },
  },
} as const;
