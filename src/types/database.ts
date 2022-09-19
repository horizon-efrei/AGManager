export interface VoteDocument {
  content: string;
  messageId: string;
  channelId: string;
  guildId: string;
  authorId: string;
  votes: {
    yesMemberIds: string[];
    noMemberIds: string[];
    blankMemberIds: string[];
    yesCount: number;
    noCount: number;
    blankCount: number;
  };
  finished: boolean;
  finishedAt: Date | null;
  outcome: 'blank' | 'no' | 'yes' | null;
}

export interface ProxyDocument {
  guildId: string;
  byMemberId: string;
  forMemberIds: string[];
}

export interface VoiceLogDocument {
  guildId: string;
  memberId: string;
  joinedAt: Date;
  leftAt: Date | null;
}
