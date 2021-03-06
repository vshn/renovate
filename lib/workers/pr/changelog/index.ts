import { logger } from '../../../logger';
import * as allVersioning from '../../../versioning';
import { BranchUpgradeConfig } from '../../common';
import { ChangeLogResult } from './common';
import { getInRangeReleases } from './releases';
import * as sourceGithub from './source-github';

export * from './common';

export async function getChangeLogJSON(
  args: BranchUpgradeConfig
): Promise<ChangeLogResult | null> {
  const { sourceUrl, versioning, fromVersion, toVersion } = args;
  try {
    if (!sourceUrl) {
      return null;
    }
    const version = allVersioning.get(versioning);
    if (!fromVersion || version.equals(fromVersion, toVersion)) {
      return null;
    }

    const releases = args.releases || (await getInRangeReleases(args));

    const res = await sourceGithub.getChangeLogJSON({ ...args, releases });
    return res;
  } catch (err) /* istanbul ignore next */ {
    logger.error({ config: args, err }, 'getChangeLogJSON error');
    return null;
  }
}
