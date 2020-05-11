import is from '@sindresorhus/is';
import yaml from 'js-yaml';
import upath from 'upath';
import { URL } from 'url';

import { logger } from '../../logger';
import { PackageFile, PackageDependency } from '../common';

export function extractPackageFile(
  content: string,
  fileName: string
): PackageFile | null {
  let doc;
  try {
    doc = yaml.safeLoad(content);
  } catch (err) {
    logger.debug({ fileName }, 'Failed to parse component class');
    return null;
  }
  const componentName = upath.parse(fileName).name.replace('-', '_');

  if (
    !(
      doc &&
      doc.parameters &&
      is.nonEmptyObject(doc.parameters.kapitan) &&
      doc.parameters[componentName] &&
      is.nonEmptyObject(doc.parameters[componentName].charts)
    )
  ) {
    logger.debug({ fileName }, 'component class has no Helm charts');
    return null;
  }
  const helmCharts: Map<string, string> = doc.parameters[componentName].charts;
  const dependencies: Record<string, any>[] =
    doc.parameters.kapitan.dependencies;
  const deps = Object.entries(helmCharts).map(([chartName, chartVersion]) => {
    const res: PackageDependency = {
      depName: chartName,
      groupName: componentName,
      currentValue: chartVersion,
    };
    const versionReference =
      '${' + componentName + ':charts:' + chartName + '}';
    const dep = dependencies.find(
      d => d.unpack && d.source.includes(versionReference)
    );
    if (!dep) {
      res.skipReason = 'Matching dependency not found';
      return res;
    }
    try {
      const fullURL = new URL(dep.source);
      let repoURL = fullURL.origin;
      const paths = fullURL.pathname.split('/');

      paths.some(p => {
        const path = decodeURI(p);
        if (path.includes(versionReference)) {
          return true;
        }
        repoURL += p + '/';
        return false;
      });
      res.registryUrls = [repoURL];
    } catch (err) {
      logger.debug({ err }, 'Error parsing url');
      res.skipReason = 'invalid-url';
    }
    return res;
  });

  return {
    deps,
    datasource: 'helm',
  };
}
