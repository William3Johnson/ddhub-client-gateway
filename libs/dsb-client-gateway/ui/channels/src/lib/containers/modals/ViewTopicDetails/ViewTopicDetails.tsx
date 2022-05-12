import { FC } from 'react';
import { DialogContent, DialogActions, Box } from '@mui/material';
import { CloseButton, Dialog } from '@dsb-client-gateway/ui/core';
import { TopicDetails } from '@dsb-client-gateway/ui/topics';
import { useViewTopicDetailsEffects } from './ViewTopicDetails.effects';
import { useStyles } from './ViewTopicDetails.styles';

export const ViewTopicDetails: FC = () => {
  const { classes } = useStyles();
  const { open, closeModal, isLoading, fields, details, buttons } =
    useViewTopicDetailsEffects();
  return (
    <Dialog open={open} onClose={closeModal} paperClassName={classes.paper}>
      <DialogContent sx={{ padding: 0 }}>
        <TopicDetails
          isLoading={isLoading}
          details={details}
          fields={fields}
          buttons={buttons}
        />
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Box className={classes.closeButtonWrapper}>
          <CloseButton onClose={closeModal} />
        </Box>
      </DialogActions>
    </Dialog>
  );
};
