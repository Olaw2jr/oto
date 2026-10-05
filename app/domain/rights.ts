import type {RightsInfo} from './catalogue';

export type RightsEvaluableSource = {
  kind: 'https' | 'local' | 'torrent';
  trustedSourceId?: string;
};

export type RightsDecisionReason =
  | 'allowed'
  | 'unknown-rights'
  | 'territory-not-allowed'
  | 'untrusted-source';

export type RightsDecision = {
  allowed: boolean;
  reason: RightsDecisionReason;
};

export class RightsPolicy {
  private readonly trustedSourceIds: Set<string>;

  constructor(
    private readonly territory: string,
    trustedSourceIds: Iterable<string>,
  ) {
    this.trustedSourceIds = new Set(trustedSourceIds);
  }

  evaluate(
    rights: RightsInfo,
    source: RightsEvaluableSource,
  ): RightsDecision {
    if (rights.status === 'unknown') {
      return {allowed: false, reason: 'unknown-rights'};
    }

    if (
      rights.territories?.length &&
      !rights.territories.includes(this.territory)
    ) {
      return {allowed: false, reason: 'territory-not-allowed'};
    }

    // A local file was either imported by the user or persisted after an
    // earlier authorized acquisition. It no longer needs remote-source trust.
    if (source.kind === 'local') {
      return {allowed: true, reason: 'allowed'};
    }

    if (
      !source.trustedSourceId ||
      !this.trustedSourceIds.has(source.trustedSourceId)
    ) {
      return {allowed: false, reason: 'untrusted-source'};
    }

    return {allowed: true, reason: 'allowed'};
  }
}
