import { type ReactNode } from 'react';
import { Dialog, type DialogProps } from '@mui/material';
import { motion } from 'framer-motion';

interface AnimatedDialogProps extends Omit<DialogProps, 'PaperProps'> {
  children: ReactNode;
  PaperProps?: DialogProps['PaperProps'];
}

const AnimatedDialog = ({ children, PaperProps, ...dialogProps }: AnimatedDialogProps) => {
  return (
    <Dialog
      {...dialogProps}
      PaperProps={{
        ...PaperProps,
        component: motion.div,
        initial: { opacity: 0, scale: 0.92, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.92, y: 20 },
        transition: { duration: 0.2, ease: 'easeOut' },
        sx: {
          ...(PaperProps?.sx as object),
        },
      }}
    >
      {children}
    </Dialog>
  );
};

export default AnimatedDialog;
