import is from '@sindresorhus/is';
import yaml from 'js-yaml';
import upath from 'upath';

import { getDep } from '../dockerfile/extract';
import { logger } from '../../logger';
import { PackageFile } from '../common';

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
      is.nonEmptyObject(doc.parameters[componentName].images)
    )
  ) {
    logger.debug({ fileName }, 'component class has no Docker images');
    return null;
  }
  const dockerImages: Map<string, Map<string, string>> =
    doc.parameters[componentName].images;
  const deps = Object.entries(dockerImages).map(([imageName, image]) => {
    const fullImage = image.image + ':' + image.tag;
    const dep = getDep(fullImage);
    dep.managerData = { imageName };
    return dep;
  });

  return { deps };
}
