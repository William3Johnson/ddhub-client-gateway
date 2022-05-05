import { ChannelType } from '../channel.const';
import { IsEnum, IsString } from 'class-validator';
import { TopicVersion } from '@dsb-client-gateway/ddhub-client-gateway-message-broker';

export class ChannelTopic {
  topicName: string;
  owner: string;
  topicId: string;
}

export class ChannelConditions {
  dids: string[];
  roles: string[];
  topics: ChannelTopic[];
  topicsVersions: { [topicId: string]: TopicVersion[] };
  qualifiedDids: string[];
}

export class ChannelEntity {
  @IsString()
  fqcn: string;

  @IsEnum(ChannelType)
  type: ChannelType;
  conditions: ChannelConditions;
  createdAt: string;
  updatedAt: string;
}
