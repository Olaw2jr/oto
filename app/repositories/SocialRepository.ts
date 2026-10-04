import type {SocialActivity} from '../domain';

export interface SocialRepository {
  listFeed(): Promise<SocialActivity[]>;
  saveActivity(activity: SocialActivity): Promise<void>;
}
