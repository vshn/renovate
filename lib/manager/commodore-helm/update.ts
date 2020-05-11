import yaml from 'js-yaml';
import is from '@sindresorhus/is';
import upath from 'upath';

import { logger } from '../../logger';
import { Upgrade } from '../common';

export function updateDependency(
  fileContent: string,
  upgrade: Upgrade
): string | null {
  logger.trace({ config: upgrade }, 'updateDependency()');
  if (!upgrade || !upgrade.depName || !upgrade.newValue) {
    logger.debug('Failed to update dependency, invalid upgrade');
    return fileContent;
  }
  const doc = yaml.safeLoad(fileContent);
  const componentName = upath.parse(upgrade.packageFile).name.replace('-', '_');
  if (
    !(
      doc &&
      doc.parameters &&
      is.nonEmptyObject(doc.parameters.kapitan) &&
      is.nonEmptyObject(doc.parameters[componentName]) &&
      is.nonEmptyObject(doc.parameters[componentName].charts)
    )
  ) {
    logger.debug(
      'Failed to update dependency, invalid component class: Could not find charts.'
    );
    return null;
  }
  const { newValue } = upgrade;
  const helmCharts: Map<string, string> = doc.parameters[componentName].charts;
  helmCharts[upgrade.depName] = newValue;

  return yaml.safeDump(doc, {
    noArrayIndent: true,
    lineWidth: 9999,
    noRefs: true,
  });
}
