import { FC } from 'react';
import { useRouter } from 'next/router';
import { Stack, Box } from '@mui/material';
import { ChannelTopic } from '@dsb-client-gateway/dsb-client-gateway-api-client';
import { useChannel } from '@dsb-client-gateway/ui/api-hooks';
import { GenericTable } from '@dsb-client-gateway/ui/core';
import { Queries, routerConst } from '@dsb-client-gateway/ui/utils';
import { ChannelInfo } from '../../components/ChannelInfo';

export const CHANNEL_TOPICS_HEADERS = [
  {
    Header: 'TOPIC NAME',
    accessor: 'topicName',
  },
];

export const Channel: FC = () => {
  const router = useRouter();
  const { channel } = useChannel(router.query[Queries.FQCN] as string);

  const navigateToMessages = (data: ChannelTopic) => {
    router.push({
      pathname: routerConst.LargeFileDownloadChannelTopic,
      query: {
        fqcn: router.query[Queries.FQCN] as string,
        topicName: data.topicName,
      },
    });
  };

  return (
    <Stack spacing={2} direction="row">
      <ChannelInfo channel={channel} />
      <Box flexGrow={1}>
        <GenericTable<ChannelTopic>
          headers={CHANNEL_TOPICS_HEADERS}
          tableRows={channel.conditions?.topics || []}
          onRowClick={navigateToMessages}
          showSearch={false}
          loadingRows={2}
        />
      </Box>
    </Stack>
  );
};
